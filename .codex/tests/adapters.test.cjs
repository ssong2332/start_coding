const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const roles = {
  planner: ['planner', '기획과 Tasks 상태 전환 전담. PRD·Tasks 작성, 요구사항 변경 분류, 검증 전환에 사용한다.'],
  architect: ['architect', '기술 설계 전담. 승인된 PRD를 바탕으로 Architecture·DECISIONS·ADR을 작성하고 변경 설계를 검토한다.'],
  implementer: ['implementer', '구현 전담. 승인된 요구사항·설계와 테스트를 근거로 소스 코드를 변경하고 검증 전환을 요청한다.'],
  reviewer: ['reviewer', '읽기 전용 코드 리뷰. 변경분의 정확성·보안·설계 일치와 구현 근거를 검토해 보고서만 낸다.'],
  quality_assurance: ['qa', '검증 전담. 빌드·테스트·화면을 실제 실행해 DoD를 판정하고 보고서와 자기 실행 로그를 남긴다.'],
  docs: ['docs', '문서화 전담. 실제 변경분을 근거로 README·CHANGELOG를 갱신하고 문서 불일치를 기록한다.'],
};
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
// Only the intentionally small adapter surface is parsed here; full TOML parsing is independent.
function inspect(name, load = read) {
  const [shared, description] = roles[name];
  const text = load('.codex/agents/' + name + '.toml').replaceAll('\r\n', '\n');
  const body = text.match(/^developer_instructions = """\n([\s\S]*?)\n"""\s*$/m);
  assert.ok(body, 'multiline instructions missing');
  assert.equal(text.slice(body.index + body[0].length).trim(), '', 'unexpected trailing configuration');
  assert.equal(text.slice(0, body.index).trim(), 'name = "' + name + '"\ndescription = "' + description + '"');
  const instruction = body[1], rolePath = '.agents/roles/' + shared + '.role.md';
  assert.ok(instruction.includes(rolePath), 'shared role is not referenced');
  assert.ok(instruction.indexOf('AGENTS.md') < instruction.indexOf(rolePath));
  for (const rule of [
    /먼저 읽/, /필수.*읽기.*소유권.*승인.*원문 인용.*보고/, /AGENTS\.md.*최상위/,
    /공통 원본.*우선/, /메인 세션.*핸드오프/, /다른 에이전트.*호출하지/,
    /핸드오프.*\.artifacts\/handoff.*보고 파일/, /다른 도구를 직접 호출하지/,
    /부모.*권한.*상속/, /\.codex\/EXECUTION\.md/, /누락.*보고.*종료/,
  ]) assert.match(instruction, rule);
  assert.ok(instruction.split('\n').length <= 12, 'adapter duplicates role policy');
  assert.match(load('AGENTS.md'), /단일 규칙 원본/);
  assert.match(load(rolePath), new RegExp('^# Role: ' + shared + ' ', 'm'));
  assert.ok(load('.codex/EXECUTION.md').length > 0);
  return shared;
}
for (const name of Object.keys(roles)) {
  test(name + ' connects to the actual shared role and keeps identity', () => inspect(name));
}
test('quality_assurance resolves qa instead of a nonexistent matching filename', () => {
  assert.equal(inspect('quality_assurance'), 'qa');
  assert.equal(fs.existsSync(path.join(root, '.agents/roles/quality_assurance.role.md')), false);
});
test('reviewer inherits parent settings and connects to shared write prohibition', () => {
  inspect('reviewer');
  assert.match(read('.agents/roles/reviewer.role.md'), /파일 수정 금지/);
});
for (const missing of ['AGENTS.md', '.agents/roles/implementer.role.md']) {
  test('rejects missing source ' + missing, () => {
    assert.throws(() => inspect('implementer', p => {
      if (p === missing) throw new Error('missing source: ' + missing);
      return read(p);
    }), /missing source/);
  });
}
test('rejects wrong shared-role mapping', () => {
  assert.throws(() => inspect('quality_assurance', p =>
    read(p).replaceAll('.agents/roles/qa.role.md', '.agents/roles/reviewer.role.md')
  ), /shared role is not referenced/);
});
test('rejects added model and permission settings', () => {
  for (const setting of ['model = "unexpected"', 'sandbox_mode = "read-only"', 'approval_policy = "never"']) {
    assert.throws(() => inspect('reviewer', p => p.endsWith('reviewer.toml')
      ? read(p).replace('developer_instructions', setting + '\ndeveloper_instructions') : read(p)));
  }
});
function wiring(config) {
  const entries = config.hooks.PreToolUse;
  const shell = entries.filter(e => e.matcher.split('|').includes('Bash'));
  const patch = entries.filter(e => e.matcher.split('|').includes('apply_patch'));
  assert.equal(shell.length, 1);
  assert.equal(patch.length, 1);
  assert.deepEqual(shell[0].hooks.map(h => h.command), [
    'node .claude/hooks/block-main-writes.js', 'node .claude/hooks/block-no-verify.js', 'node .claude/hooks/block-env-access.js',
  ]);
  assert.deepEqual(patch[0].hooks.map(h => h.command), ['node .claude/hooks/block-env-access.js']);
  for (const entry of entries) for (const hook of entry.hooks) {
    assert.equal(hook.type, 'command');
    assert.equal(hook.timeout, 10);
    assert.ok(fs.statSync(path.join(root, hook.command.slice('node '.length))).isFile());
  }
}
test('real Codex hook wiring retains shared guards', () => wiring(JSON.parse(read('.codex/hooks.json'))));
test('rejects broken hook wiring', () => {
  const config = JSON.parse(read('.codex/hooks.json'));
  config.hooks.PreToolUse[0].hooks.pop();
  assert.throws(() => wiring(config));
});
function guard(file, payload) {
  const result = spawnSync(process.execPath, [path.join(root, '.claude/hooks', file)], {
    cwd: root, input: JSON.stringify(payload), encoding: 'utf8', timeout: 10000,
  });
  assert.ifError(result.error);
  return result;
}
test('bypass guard blocks a dummy bypass command and allows status', () => {
  const result = guard('block-no-verify.js', { tool_name: 'Bash', tool_input: { command: 'git commit --no-verify' } });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /차단/);
  assert.equal(guard('block-no-verify.js', { tool_name: 'Bash', tool_input: { command: 'git status' } }).status, 0);
});
test('secret guard checks dummy paths without reading or writing an env file', () => {
  for (const action of ['Add File:', 'Update File:', 'Delete File:', 'Move to:']) {
    const result = guard('block-env-access.js', {
      tool_name: 'apply_patch', tool_input: { command: '*** ' + action + ' .env.local\n' },
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /차단/);
  }
  assert.equal(guard('block-env-access.js', { tool_name: 'Read', tool_input: { file_path: '.env.example' } }).status, 0);
  assert.equal(guard('block-env-access.js', {}).status, 0);
});
test('execution guide handles distinct session IDs, completion and evidence loss', () => {
  const text = read('.codex/EXECUTION.md');
  for (const marker of ['session_id', 'write_stdin', 'cell_id', 'functions.wait', '미검증', 'stdout', 'stderr', '종료 코드', '명령 원문', '실제 경로']) {
    assert.ok(text.includes(marker), 'missing execution contract: ' + marker);
  }
  assert.ok(text.trimEnd().split(/\r?\n/).length < 64);
});

for (const setting of ['model = "unexpected"', 'sandbox_mode = "read-only"', 'approval_policy = "never"']) {
  test('rejects trailing setting: ' + setting, () => {
    assert.throws(() => inspect('reviewer', p => p.endsWith('reviewer.toml')
      ? read(p) + '\n' + setting + '\n' : read(p)));
  });
}
