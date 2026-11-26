# Playground Starter

나만의 프로토타입 놀이터를 만드는 스타터예요. 프롬프트 하나면 설치부터 비밀번호가 걸린 내 사이트까지 한 번에 만들어지고, 그다음엔 말로 부탁하면 Claude Code가 프로토타입을 만들어 줘요.

- 디자인: [Toolcraft](https://github.com/pixel-point/toolcraft)(MIT, Pixel Point)를 바탕으로 한 툴 화면
- 갤러리, 비밀번호 잠금, 썸네일, 라이트/다크 모드가 들어 있어요
- 필요한 것: [Claude Code](https://claude.com/claude-code) 하나. GitHub와 Vercel 가입(둘 다 무료)은 설정 중에 Claude가 안내해요

## 시작하기

Claude Code(Claude 앱의 Code 탭)를 열고 **[PROMPT.md](PROMPT.md)의 시작 프롬프트**를 통째로 복사해서 붙여넣으세요.

Claude가 묻는 것에 답하고, 안내하는 버튼만 누르면 돼요.

1. 사이트 이름 정하기
2. (Mac) "개발자 도구 설치" 창에서 '설치' 누르기 (10~15분)
3. GitHub 가입(이메일, 무료)하고 브라우저에서 승인하기
4. 사이트 비밀번호 정하기
5. Vercel 가입: 'Continue with GitHub' 누르기

끝나면 내 컴퓨터의 갤러리와, 폰에서도 열리는 비밀번호 걸린 내 사이트 주소가 생겨요.

## 그다음엔 말로 해요

| 이렇게 말하면 | 이렇게 돼요 |
|---|---|
| "마우스를 따라 번지는 물감 효과 만들어줘" | 새 프로토타입이 만들어지고 브라우저에 바로 보여요 |
| "슬라이더 하나 더 추가해줘", "색을 더 밝게" | 보면서 계속 고칠 수 있어요 |
| "올려줘" / "배포해줘" | GitHub에 저장되고 내 사이트에 바로 올라가요 |
| "되돌려줘" | 저장해 둔 이전 상태로 돌아가요 (GitHub에 이력이 남아 있어요) |

다음에 다시 작업할 때는 터미널에서 플레이그라운드 폴더로 가서 `claude`를 실행하거나, Claude 앱에서 그 폴더를 열면 돼요.

---

## For the AI agent: setup steps

You were asked to create a playground from this repository for someone who may have nothing installed but Claude Code. Do every step yourself, non-interactively, and explain only what the person must do (in their language, without jargon). Setup ends with the playground online behind a password. The only things the person does: answer the name question (step 3), click Install for Apple's developer tools if asked (step 6), sign up / approve GitHub in the browser (step 8), choose the site password (step 11) and sign up / log in to Vercel in the browser (step 12).

**Web pages (sign-ups, logins, approvals).** Whenever the person has to sign up, log in or approve something, open that page in their own default browser yourself (`open "<url>"` on macOS, `start "" "<url>"` on Windows) and also show the link in case it didn't open. Use their normal browser, never a built-in or automated one, and never type into sign-up or login forms: the person enters their own email, password and codes. Then wait until they say it's done.

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
8. **GitHub login.** Ask whether they have a GitHub account. If not, open https://github.com/signup in their browser and say: "열린 페이지에서 이메일로 가입해 주세요 (무료). 다 되면 '했어'라고 말해주세요." Then run `gh auth login --hostname github.com --git-protocol https --web` in the background. It prints a one-time code and https://github.com/login/device: open that page in their browser, show the code in large plain text, and ask them to paste it and press 'Authorize'. Wait until `gh auth status` succeeds, then `gh auth setup-git`.
9. **Identity.** In the project: `git config user.name "$(gh api user --jq .login)"` and `git config user.email "$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"`. (Vercel refuses Git deploys from commit authors that aren't a GitHub account; the noreply address also keeps their email private.)
10. **Repository.** `git init -b main`, `git add -A`, `git commit -m "Start my playground"`, then `gh repo create <folder-name> --private --source . --remote origin --push`. Private, so only they can see the code.
11. **Site password.** Ask: "사이트 비밀번호를 정해주세요. 내 사이트를 열 때 입력하는 비밀번호예요 (다른 곳에서 쓰는 비밀번호 말고 새로 정해주세요)." Keep it only in memory for step 14: never write it into a file, commit or log, and don't repeat it back.
12. **Vercel login.** Tell the person: "이제 인터넷에 올릴 곳(Vercel, 무료)에 가입할게요. 열리는 페이지에서 'Continue with GitHub'를 누르면 방금 만든 GitHub 계정으로 바로 가입돼요." Run `npx --yes vercel@latest login` in the background; it prints a link (and maybe a code): open the link in their browser, show the code if there is one, and wait until it finishes. `npx vercel whoami` confirms it.
13. **Vercel setup**: `npm run deploy:setup` (links the project, connects the GitHub repo, production only, no bot comments, 1-day retention). If connecting GitHub fails, carry on: `ship` then uploads from the folder.
14. **Publish.** `printf '%s' "<password>" | npx vercel env add SITE_PASSWORD production`, then `npm run ship`. It prints the live link; `ship` refuses to publish without the password.
15. **Finish** by telling the person, in a few lines:
   - their site: the live link from step 14 (it asks for the password they chose; works on their phone too)
   - their gallery on this computer: http://localhost:3000 (one example, Gradient Orb); their code: the GitHub repo link
   - to make something, just describe it; to put changes online, say "올려줘" or "배포해줘"; "되돌려줘" goes back
   - next time: open Claude Code in `~/Documents/my-playground` (from a terminal: `cd ~/Documents/my-playground` then `claude`). The project's rules (`AGENTS.md`, loaded through `CLAUDE.md`) take over from there.

If a GitHub step fails or the person wants to skip it, carry on without it: steps 12–14 still publish (the person signs up to Vercel with email instead), and they can say "GitHub 연결해줘" later; AGENTS.md has the same steps. If a Vercel step fails, finish with the local gallery and say "배포해줘" retries it.

From then on, follow `AGENTS.md` in the project folder: it covers creating prototypes, the design system, and deploying (`npm run deploy:setup` once, then `npm run ship`: production only, no pull requests or preview deployments).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server at http://localhost:3000 (no password locally) |
| `npm run new -- <slug> "Title" "Description" [--motion]` | Scaffold a new prototype (`--motion`: animated loop with PNG/MP4 export) |
| `npm run verify -- <slug>` | Check a prototype in a real browser and capture its thumbnails |
| `npm run thumbnails -- <slug>` | Capture gallery thumbnails (needs `npx playwright install chromium` once) |
| `npm run check` | Lint + type-check + production build |
| `npm run deploy:setup` | First deploy only: link Vercel with quiet, production-only settings |
| `npm run ship -- <slug>` | Deploy: push to GitHub and put it online (see AGENTS.md → Deploying) |

## License

MIT. The tool UI is adapted from Toolcraft by Pixel Point (MIT); see `components/playground/tool/THIRD_PARTY.md`.
