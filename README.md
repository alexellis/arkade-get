# setup-arkade-v2

Install CLI tools using arkade

```yaml
    - uses: alexellis/setup-arkade@v1
    - uses: alexellis/arkade-get@master
      with:
        kubectl: latest
        faas-cli: 0.14.10
    - name: check for faas-cli
      run: |
        $HOME/.arkade/bin/faas-cli version
```

# Development

Regenerate the list of tools:

```bash
cd to-inputs
go run . -j schema.json -y inputs.yaml
cp schema.json ../
cat ../action.yml.tmpl | INPUTS=$(cat inputs.yaml) envsubst > ../action.yml

```
npm run prepare
```
