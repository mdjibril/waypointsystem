# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# workflow
- Work on feature branches, verify everything works, then merge to main before proceeding to the next task sequentially. Confidence: 0.75

# documentation
- In test plans, include the full, copy-pasteable CLI commands (e.g., curl, npm run) for every test step instead of just describing what to verify. Confidence: 0.65
- Consult plan.md for development guidelines when working on features. Confidence: 0.65
- After completing each task, write the test flow in test.md. Confidence: 0.75

# testing
- Prefer UI-based test steps over CLI/curl-based test steps in test plans. Confidence: 0.60

