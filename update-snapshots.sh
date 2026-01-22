# In update-snapshots.sh
docker run --rm -v ${PWD}:/work -w /work -it mcr.microsoft.com/playwright:v1.55.1-jammy npx playwright test --update-snapshots