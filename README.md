# Unity Life Group — Website

The website for Unity Life Group, a life insurance agency. This is currently a
clean starter **shell** (header, empty content area, footer) built to be
expanded section by section over time.

## What it's built with

- **HTML / CSS** — the page structure and styling ("Modern Slate" theme).
- **Node.js + Express** — a small server that delivers the site to visitors.
- Hosted on **Railway**, with the code stored on **GitHub**.

## Project structure

```
unity-life-group/
├── server.js          The small web server (Railway runs this).
├── package.json        Project settings and the "start" command.
├── .gitignore          Files that should not be uploaded to GitHub.
├── README.md           This file.
└── public/             Everything a visitor sees.
    ├── index.html      The page (header, main area, footer).
    ├── css/styles.css  All colors, fonts, and layout.
    └── js/main.js      Space for future interactive features.
```

## Run it on your own computer

1. Install [Node.js](https://nodejs.org) (the "LTS" version).
2. Open a terminal in this folder.
3. Install the helper packages (only needed the first time):
   ```
   npm install
   ```
4. Start the site:
   ```
   npm start
   ```
5. Open your browser to **http://localhost:3000**

Press `Ctrl + C` in the terminal to stop the server.

## How it deploys

Railway watches the GitHub repository. Whenever new code is pushed to GitHub,
Railway automatically runs `npm install` and then `npm start`, using the
`PORT` it provides to put the site online.
