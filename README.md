# docker-hub-retention

This action allows to delete old unused images from dockerhub

## Usage

single:
```yaml
name: docker-hub-retention

on:
  schedule:
    - cron: "0 2 * * 1" 
  workflow_dispatch:

jobs:
  dependencies:
    runs-on: [ubuntu-latest]
    steps:
      - name: docker hub retention
        id: docker-hub-retention
        uses: philiplehmann/docker-hub-retention@main
        with:
          repository: philiplehmann/puppeteer
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
          match: ([0-9\.]+)-([0-9]+)
          retention: 90d
          dryrun: "true"
```

multiple:
```yaml
name: docker-hub-retention

on:
  schedule:
    - cron: "0 2 * * 1" 
  workflow_dispatch:

jobs:
  dependencies:
    runs-on: [ubuntu-latest]
    steps:
      - name: docker hub retention
        id: docker-hub-retention
        uses: philiplehmann/docker-hub-retention@main
        with:
          repository: philiplehmann/puppeteer
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
          multiple: |
            - match: ([0-9\.]+)-([0-9]+)
              retention: 90d
            - match: build-cache.*
              retention: 1m
          dryrun: "true"
```