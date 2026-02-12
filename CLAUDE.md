## **Coding Style**

- **Task Handoff:** When handing off tasks to others, always include the required protocols, interfaces, schemas, and naming conventions to ensure consistency.
- **Commit Previews:** When a commit is requested, provide a preview in the form of a Commit Table that includes the Commit Message, Commit Files, and a concise Commit Content Summary.
- **Conversational Transparency:** During the active conversation and within code blocks provided in chat, **do not anonymize identifiers**. Use real domains, URLs, IPs, hostnames, absolute paths, usernames, and project names to ensure technical accuracy and ease of debugging.
- **Secret Masking:** Regardless of the context, **never include secrets** (OAuth/JWT/API keys/tokens). Mask any example secret values in a format-preserving way without keeping any real prefix (use <REDACTED> or synthetic placeholders).
- **Documentation Anonymity:** When documenting finalized outcomes in separate docs or summary reports, **apply anonymization** to all identifiers. Replace real system fingerprints with generic placeholders to ensure the documentation is safe for broader distribution.
- **Learning Mode:** If the phrase 'Activate Learning Mode' is present, please partially leave value names, keywords, and logic blank, provide only comments for important sections, and intentionally implement incorrect logic as needed.
- **Validation First:** Whenever possible, prioritize unit tests to validate the operational status of the environment, tools, model names, and permissions before implementing the core logic.
- **Focused Output:** Focus strictly on the modified sections rather than outputting the entire file unless necessary. Omit unchanged imports and irrelevant logic blocks using placeholders like ... (unchanged imports) ... to keep the response clean.
- **Change Tracking:** After modifying a file, specify the filename and the exact lines modified.
- **Environment:** Normally, use Bash. CMD is the second priority. Only use PowerShell when explicitly requested, as it frequently causes encoding errors.
- **Tone and Comments:** Maintain a professional tone without emojis. Write all code comments in English, adhering to a 'Public Repository' standard. Comments must be objective and understandable based solely on logic, without referencing the current conversation.
- **Structure:** Follow a 'Why, What, How' step-by-step approach for each feature. 'How' refers to actual implementation details like logs, commands, or code. Provide full, working code for the specific feature being modified.
- **Roadmap:** Start with a brief, high-level roadmap. Provide detailed specifications only for the current step. Verify execution and logs before planning the details of the next stage to avoid invalid assumptions.
- **Link Format:** Use the following format for Markdown file links: [filename:start_line-end_line](relative_path#Lstart_line-Lend_line).
- **Value Masking (Format-Preserving):** When showing partial real values (where masking is required), never keep the original first 4 characters. Generate a synthetic 4-character prefix matching the format (e.g., hex -> 1a2b...). Preserve only the type/pattern (numeric/alnum/uuid/email).

## Refactoring & Structure

- **Split Trigger:** Do not use line count as a hard threshold. Split when a file's responsibility cannot be described in a single sentence without "and." If it requires "A and B," it is a candidate for splitting.
- **Split Unit:** Every file must have a one-line Responsibility comment at the top describing what it exclusively handles (e.g., // Responsibility: Handles notification channel selection and dispatch only). The split reason itself belongs in the commit message, not in the file.
- **Merge Back:** If a single feature change requires opening more than 3 files, or if an intermediate layer only delegates without adding its own logic, treat it as over-separation. Merge back and document the reason in the commit message.
- **Central Registry:** Cross-cutting concerns (validation rules, error codes, constants, shared configurations) must reside in a dedicated directory per concern type (e.g., validation/, constants/). Within that directory, split files by domain (e.g., UserValidation, OrderValidation). Use the Common prefix for non-domain-specific shared rules (e.g., CommonValidation, CommonConstants).
- **Naming & Navigation:** Use domain-based naming for packages and files. Pattern: {Domain}{Concern} for domain-specific (UserValidation), Common{Concern} for shared (CommonValidation). A new team member should locate any file by knowing only the domain name and concern type.

---

# [제목]

본 문서는 처음 합류하는 개발자도 맥락을 이해할 수 있도록 비즈니스 문서 형식으로 작성해주세요.
Public/Private 레포에 따라 익명화 수준이 다릅니다. 하단 익명화 확인 항목을 참고해주세요.

## 개요

- 프로젝트:
- 공개 범위: (Public / Private)
- 한 줄 요약: (Why + What)
- 영향 범위: (API / DB / UI / 배포 등)
- 수정 파일 / 참조 커밋:
- 일시:
- 버전:
- Phase:
- 의도:
- 동작:

## 아키텍처 / 흐름

## 검증

---

## 트러블슈팅

원인:

해결:

로그:

검증:

---

## 레퍼런스

---

## 익명화 확인

### Private repo (팀 내부)

인증정보(API키/토큰/시크릿), DB접속정보, 로그 내 민감정보(실명, 이메일, 토큰값, 파라미터 등)

### Public 공개 (블로그, 포트폴리오 등)

위 항목 + 내부 도메인, 실제 IP, 비표준 포트, 레포URL, 커밋author, 회사/프로젝트명, 서버명, 경로 내 사용자명, 클라우드 리소스 정보, 내부 협업 채널/링크, 내부 이슈 트래커, 팀원 식별 정보, 샘플 데이터(실데이터처럼 보이는 것), 스크린샷 내 정보(주소창, 사이드바, 알림 등)
