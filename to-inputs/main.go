package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"

	execute "github.com/alexellis/go-execute/pkg/v1"
)

func main() {

	var (
		yamlFile, jsonFile string
	)
	flag.StringVar(&yamlFile, "y", "", "File to write for actions inputs as YAML")
	flag.StringVar(&jsonFile, "j", "", "File to write for actions inputs as JSON")

	flag.Parse()

	if len(yamlFile) == 0 && len(jsonFile) == 0 {
		fmt.Println("You must supply a file to write to for -y and -j, see --help")
		return
	}

	cmd := execute.ExecTask{
		Command:     "arkade",
		Args:        []string{"get", "-o", "list"},
		StreamStdio: false,
	}

	res, err := cmd.Execute()
	if err != nil {
		panic(err)
	}

	if res.ExitCode != 0 {
		panic("Non-zero exit code: " + res.Stderr)
	}

	yFile, err := os.Create(yamlFile)
	if err != nil {
		panic(err)
	}

	defer yFile.Close()

	schema := []string{}
	fmt.Fprintf(yFile, `inputs:
`)
	lines := strings.Split(strings.TrimSpace(res.Stdout), "\n")
	for _, line := range lines {
		cli := strings.TrimSpace(line)
		schema = append(schema, cli)

		fmt.Fprintf(yFile, `  %s:
    description: 'Install %s'
    required: false
`, cli, cli)
	}

	jFile, err := os.Create(jsonFile)
	if err != nil {
		panic(err)
	}
	en := json.NewEncoder(jFile)
	if err := en.Encode(schema); err != nil {
		panic(err)
	}

}
