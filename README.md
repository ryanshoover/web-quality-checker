# Web Quality Checker

Want to run simple speed quality checks on a large number of websites? Use me!
Want detailed reports on a single website? Use [webpagetest](https://webpagetest.org).

Give me a CSV with a list of URLs and I'll tell you how many CSS and JS files they have that aren't minified. Why check if they don't have minified files? Because that's a good indicator if the website has done work optimizing for speed and performance.

## Install the app

I need Node.js v6+ to run.

Clone the site to your local computer

```bash
$ git clone git@github.com:ryanshoover/web-quality-checker.git
```

Install our needed dependencies

```bash
$ npm install
```

## Run the app

Run the app

```bash
$ npm run app
```

Tell the app where the input and output files are

```bash
$ npm run app

> web-quality-checker@1.0.0 app /Users/ryan.hoover/Sites/web-quality-checker
> node index.js

What is the path to the CSV file with the URLs?   /tmp/domains.csv
What file should results be written to?           /tmp/processed-domains.csv
```

Let it run!

## Run the app (advanced edition)

Rather than passing in the input and output files at runtime, you can pass them through environment variables

```bash
INPUT_FILE=/absolute/path/to/your/input_file.csv
OUTPUT_FILE=/absolute/path/to/your/output_file.csv
MAX_LINES=3
URL_COLUMN=domain
FILE_TYPES=csv,js
```
