# Playground Starter

나만의 프로토타입 놀이터를 만드는 스타터예요. 말로 부탁하면 Claude Code가 프로토타입을 만들어 주고, "배포해줘" 한마디면 인터넷 주소가 생겨요.

- 디자인: [Toolcraft](https://github.com/pixel-point/toolcraft)(MIT, Pixel Point)를 바탕으로 한 툴 화면
- 갤러리, 비밀번호 잠금, 썸네일, 라이트/다크 모드가 들어 있어요
- 필요한 것: [Claude Code](https://claude.com/claude-code) 하나. GitHub 가입과 연결은 설정 중에 Claude가 안내해요

## 시작하기

Claude Code를 열고 아래 문장을 그대로 붙여넣으세요.

```text
https://github.com/Joshuamyunghooncho/playground-starter 로 내 플레이그라운드 만들어줘
```

Claude가 사이트 이름을 물어보면 답하세요. 설치가 끝나면 브라우저에 내 갤러리가 열려요.

이어서 작업을 보관할 GitHub를 연결해요. Claude가 알려주는 대로 GitHub에 가입(이메일, 무료)하고, 브라우저에 코드를 붙여넣어 승인하면 끝이에요. Mac에서 "개발자 도구 설치" 창이 뜨면 '설치'를 눌러주세요.

## 그다음엔 말로 해요

| 이렇게 말하면 | 이렇게 돼요 |
|---|---|
| "마우스를 따라 번지는 물감 효과 만들어줘" | 새 프로토타입이 만들어지고 브라우저에 바로 보여요 |
| "슬라이더 하나 더 추가해줘", "색을 더 밝게" | 보면서 계속 고칠 수 있어요 |
| "배포해줘" | 인터넷 주소가 생겨요. 처음 한 번만 Vercel 가입/로그인(이메일)과 비밀번호 정하기가 있어요 |
| "되돌려줘" | 저장해 둔 이전 상태로 돌아가요 (GitHub에 이력이 남아 있어요) |

다음에 다시 작업할 때는 터미널에서 플레이그라운드 폴더로 가서 `claude`를 실행하거나, Claude 앱에서 그 폴더를 열면 돼요.

---

## For the AI agent: setup steps

You were asked to create a playground from this repository for someone who may have nothing installed but Claude Code. Do every step yourself, non-interactively, and explain only what the person must do (in their language, without jargon). The only things the person does: answer the name question (step 3), click Install for Apple's developer tools if asked (step 6), and sign up / approve GitHub in the browser (step 8).

1. **Node.js ≥ 20.** Check `node -v`. If it is missing or older:
   - macOS / Linux: install nvm without sudo, then Node LTS:
     `curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`, then in the same shell `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm install --lts`. Later shells may need the same two-part prefix until the person opens a new terminal.
   - Windows: `winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements`, then use the full path (`"C:\Program Files\nodejs\npm.cmd"`) or a new shell.
2. **Download** (no git needed yet) into the person's Documents folder:
   `npx --yes giget@latest gh:Joshuamyunghooncho/playground-starter ~/Documents/my-playground` (Windows: `%USERPROFILE%\Documents\my-playground`). If that folder exists, pick `my-playground-2`, etc. Never overwrite.
3. **Name.** Ask: "사이트 이름을 뭐로 할까요? (예: 민지 Playground)". Write it to `SITE_NAME` in `lib/site-config.ts`.
4. **Install**: `npm install` in that folder.
5. **Run**: start `npm run dev` in the background, wait until http://localhost:3000 answers, then open it in the person's browser (`open` on macOS, `start` on Windows). Tell them their gallery is open, then continue: "이제 작업을 안전하게 보관할 GitHub를 연결할게요."
6. **Git.** Check: macOS `xcode-select -p` (do NOT run `git` before this succeeds: it pops up a dialog); Windows/Linux `git --version`. If missing:
   - macOS: run `xcode-select --install` and tell the person: "화면에 뜬 창에서 '설치'를 눌러주세요 (5~10분 걸려요)". Wait until `xcode-select -p` succeeds.
   - Windows: `winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements`, then use `"C:\Program Files\Git\cmd\git.exe"` or a new shell.
7. **GitHub CLI (`gh`).** Check `gh --version`. If missing:
   - macOS: `brew install gh` if Homebrew exists; otherwise (no sudo) get the latest tag from `curl -sI https://github.com/cli/cli/releases/latest` (the `location:` header), download `https://github.com/cli/cli/releases/download/v<ver>/gh_<ver>_macOS_universal.zip`, unzip into `~/.local/share/gh`, and use `~/.local/share/gh/gh_<ver>_macOS_universal/bin/gh` (add its folder to PATH in `~/.zprofile`).
   - Windows: `winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements`.
8. **GitHub login.** Tell the person: "GitHub 계정이 없으면 https://github.com/signup 에서 이메일로 가입해 주세요 (무료). 있으면 바로 다음으로 가요." Then run `gh auth login --hostname github.com --git-protocol https --web` in the background. It prints a one-time code and https://github.com/login/device: show both, ask them to open the page, paste the code and approve. Wait until `gh auth status` succeeds, then `gh auth setup-git`.
9. **Identity.** In the project: `git config user.name "$(gh api user --jq .login)"` and `git config user.email "$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"`. (Vercel refuses Git deploys from commit authors that aren't a GitHub account; the noreply address also keeps their email private.)
10. **Repository.** `git init -b main`, `git add -A`, `git commit -m "Start my playground"`, then `gh repo create <folder-name> --private --source . --remote origin --push`. Private, so only they can see the code.
11. **Finish** by telling the person, in a few lines:
   - their gallery: http://localhost:3000 (one example, Gradient Orb); their code: the GitHub repo link
   - to make something, just describe it; to put it online, say "배포해줘"
   - next time: open Claude Code in `~/Documents/my-playground` (from a terminal: `cd ~/Documents/my-playground` then `claude`). The project's rules (`AGENTS.md`, loaded through `CLAUDE.md`) take over from there.

If a GitHub step fails or the person wants to skip it, finish without it (the playground works locally) and say they can say "GitHub 연결해줘" any time; AGENTS.md has the same steps.

From then on, follow `AGENTS.md` in the project folder: it covers creating prototypes, the design system, and deploying with the Vercel CLI.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server at http://localhost:3000 (no password locally) |
| `npm run new -- <slug> "Title" "Description"` | Scaffold a new prototype |
| `npm run thumbnails -- <slug>` | Capture gallery thumbnails (needs `npx playwright install chromium` once) |
| `npm run check` | Lint + type-check + production build |
| `npx vercel deploy --prod --yes` | Deploy (see AGENTS.md → Deploying) |

## License

MIT. The tool UI is adapted from Toolcraft by Pixel Point (MIT); see `components/playground/tool/THIRD_PARTY.md`.
