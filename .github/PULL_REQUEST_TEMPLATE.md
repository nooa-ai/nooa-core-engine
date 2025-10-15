# Pull Request

## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Changes Made

List the main changes:

-
-
-

## Clean Architecture Compliance

- [ ] Changes follow Clean Architecture principles
- [ ] Dependencies point inward (outer layers depend on inner layers)
- [ ] No business logic in outer layers
- [ ] Proper separation of concerns

## Self-Validation

**Did you run self-validation?**

```bash
npm run build && npm start .
```

**Result**:
- [ ] ✅ 0 errors, 0 warnings
- [ ] ⚠️ Some warnings (explain below)
- [ ] ❌ Errors found (must fix before merge)

**Output**:
```
Paste the validation output here
```

## Testing

- [ ] Build succeeds (`npm run build`)
- [ ] Self-validation passes
- [ ] No TypeScript compilation errors
- [ ] Changes tested manually

## Documentation

- [ ] README.md updated (if needed)
- [ ] CHANGELOG.md updated
- [ ] New features documented in `docs/`
- [ ] Code includes clear comments

## Breaking Changes

Does this PR introduce breaking changes?

- [ ] No breaking changes
- [ ] Yes, breaking changes (describe below)

**If yes, describe the breaking changes and migration path:**

## Related Issues

Closes #(issue number)

## Additional Notes

Any additional information reviewers should know.

---

## Reviewer Checklist

- [ ] Code follows Clean Architecture
- [ ] Self-validation passes
- [ ] Documentation is complete
- [ ] No unnecessary dependencies added
- [ ] Changes are backward compatible (or breaking changes are justified)
