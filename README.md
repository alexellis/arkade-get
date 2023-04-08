# arkade-get
## Get all the CLIs you need from arkade for a GitHub Action

Install CLI tools using [arkade](https://arkade.dev):

Specify either a version/tag, or "latest" to get the latest available.

```yaml
    - uses: alexellis/setup-arkade@v2
    - uses: alexellis/arkade-get@master
      with:
        kubectl: latest
        faas-cli: 0.14.10
    - name: check for faas-cli
      run: |
        faas-cli version
```

The binaries are placed in `$HOME/.arkade/bin/` and the action adds this to your `$PATH` variable.

Optionally, if you wish (this is not necessary), you can move the binaries to `/usr/local/bin/`:

```yaml
    - name: Install custom CLIs
      run: |
        sudo mv $HOME/.arkade/bin/* /usr/local/bin/
```

Why use `@master`?

GitHub Actions does not yet support dynamic inputs, so the inputs are generated from the `arkade get -o list` command.

See how: [to-inputs/main.go](https://github.com/alexellis/arkade-get/blob/master/to-inputs/main.go)

How often is the list of inputs updated?

A nightly job runs via Cron to update the action: [.github/workflows/update-tools.yml](https://github.com/alexellis/arkade-get/blob/master/.github/workflows/update-tools.yml)

# Development

## Update the dist folder

Do this after making a change.

```
npm run prepare
```

## Regenerate the list of tools from `arkade get`:

Make sure you have the pre-reqs:

```bash
npm i -g @vercel/ncc

# envsubst is also required
```

Then:

```bash
cd to-inputs
go run . -j schema.json -y inputs.yaml
cp schema.json ../
cat ../action.yml.tmpl | INPUTS=$(cat inputs.yaml) envsubst > ../action.yml
npm run prepare
cd ../
```

Note that the above is regenerated and committed back to the repository once per day at midnight.

