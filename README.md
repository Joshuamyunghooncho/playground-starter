# Playground Starter

나만의 프로토타입 놀이터를 만드는 스타터예요. 말로 부탁하면 Claude Code가 프로토타입을 만들어 주고, "배포해줘" 한마디면 인터넷 주소가 생겨요.

- 디자인: [Toolcraft](https://github.com/pixel-point/toolcraft)(MIT, Pixel Point)를 바탕으로 한 툴 화면
- 갤러리, 비밀번호 잠금, 썸네일, 라이트/다크 모드가 들어 있어요
- 필요한 것: [Claude Code](https://claude.com/claude-code) 하나. GitHub 계정은 없어도 돼요

## 시작하기

Claude Code를 열고 아래 문장을 그대로 붙여넣으세요.

```text
https://github.com/Joshuamyunghooncho/playground-starter 로 내 플레이그라운드 만들어줘
```

Claude가 사이트 이름을 물어보면 답하면 끝이에요. 설치가 끝나면 브라우저에 내 갤러리가 열려요.

## 그다음엔 말로 해요

| 이렇게 말하면 | 이렇게 돼요 |
|---|---|
| "마우스를 따라 번지는 물감 효과 만들어줘" | 새 프로토타입이 만들어지고 브라우저에 바로 보여요 |
| "슬라이더 하나 더 추가해줘", "색을 더 밝게" | 보면서 계속 고칠 수 있어요 |
| "배포해줘" | 인터넷 주소가 생겨요. 처음 한 번만 Vercel 가입/로그인(이메일)과 비밀번호 정하기가 있어요 |
| "GitHub에도 올려줘" | (선택) 작업 이력을 GitHub에 보관해요 |

다음에 다시 작업할 때는 터미널에서 플레이그라운드 폴더로 가서 `claude`를 실행하거나, Claude 앱에서 그 폴더를 열면 돼요.

---

## For the AI agent: setup steps

You were asked to create a playground from this repository for someone who may have nothing installed but Claude Code. Do every step yourself, non-interactively, and explain only what the person must do (in their language, without jargon). Ask at most the one question in step 3.

1. **Node.js ≥ 20.** Check `node -v`. If it is missing or older:
   - macOS / Linux: install nvm without sudo, then Node LTS:
     `curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`, then in the same shell `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm install --lts`. Later shells may need the same two-part prefix until the person opens a new terminal.
   - Windows: `winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements`, then use the full path (`"C:\Program Files\nodejs\npm.cmd"`) or a new shell.
2. **Download** (no git or GitHub account needed) into the person's Documents folder:
   `npx --yes giget@latest gh:Joshuamyunghooncho/playground-starter ~/Documents/my-playground` (Windows: `%USERPROFILE%\Documents\my-playground`). If that folder exists, pick `my-playground-2`, etc. Never overwrite.
3. **Name.** Ask: "사이트 이름을 뭐로 할까요? (예: 민지 Playground)". Write it to `SITE_NAME` in `lib/site-config.ts`.
4. **Install**: `npm install` in that folder.
5. **Checkpoint** (only if `git --version` works; skip silently otherwise): `git init`, set a local `user.name`/`user.email` if none is configured (any value; GitHub comes later), `git add -A`, `git commit -m "Start my playground"`.
6. **Run**: start `npm run dev` in the background, wait until http://localhost:3000 answers, then open it in the person's browser (`open` on macOS, `start` on Windows).
7. **Finish** by telling the person, in a few lines:
   - their gallery is open at http://localhost:3000 (it has one example, Gradient Orb)
   - to make something, just describe it; to put it online, say "배포해줘"
   - next time: open Claude Code in `~/Documents/my-playground` (from a terminal: `cd ~/Documents/my-playground` then `claude`). The project's rules (`AGENTS.md`, loaded through `CLAUDE.md`) take over from there.

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
