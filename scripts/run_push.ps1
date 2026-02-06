$env:GH_TOKEN = 'Tayyabali7890@'
$env:BRANCH = 'hotfix/hindi-dub'
$env:PR_TITLE = 'fix(hindi-dub): default in-player Hindi audio; fix TS types'
$env:PR_BODY = 'Adds default in-player Hindi audio track for bulk Hindi-dub imports and fixes TypeScript include/types.'
$env:CREATE_PR = 'true'

node scripts\github_push.js
