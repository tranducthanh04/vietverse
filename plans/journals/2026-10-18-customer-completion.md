# Thực hiện audit khách hàng: integrity và đọc/thu âm

## Phạm vi và trạng thái

- Owner yêu cầu triển khai tuần tự các mục còn thiếu sau báo cáo toàn bộ Docs.
- Baseline main@35c51ca, đã kiểm tra trùng origin/main; remote không có dev. Không checkout/merge nhánh khác, không stash hoặc đụng `.superpowers/`, `plans/261012-user-qa/` của người dùng.
- Đợt này sửa integrity và phần UI đọc/thu âm có yêu cầu rõ. Không hoàn thành toàn bộ curriculum, không deploy, publish CMS, migrate DB thật, mua dịch vụ hoặc ghi secrets.
- Kế hoạch: `plans/261018-customer-completion/plan.md`. CLI `ak` không có trên máy; dùng file local để lưu evidence, không tuyên bố đã cập nhật index/đóng plan. AgentWiki publish skipped.

## Đã thực hiện

| Mục audit | Thay đổi local | Trạng thái giới hạn |
| --- | --- | --- |
| F04 | Đọc lại owned receipt khi intent completed/mất giữa hai lần đọc; trả lại ID đã commit | Test xác định trên MongoDB tạm; không chứng minh lỗi storage trong ảnh đã hết |
| F05 | Atomic debit của quà ảo bao gồm điều kiện chưa sở hữu | Một yêu cầu thắng; yêu cầu còn lại 400, một ledger/redemption; compensation cũ giữ nguyên |
| F06 | Bỏ fallback client isCorrect; sort/matching thiếu/rỗng không đạt | Không tự sửa dữ liệu legacy thiếu đáp án; word_card và receipt record_voice không đổi |
| F11 | Paid policy yêu cầu active true và expiry hợp lệ trong tương lai | Không tự gia hạn/gán hạn cho record cũ; cần kiểm tra dữ liệu trước rollout |
| F09 | Hiển thị subPrompt và nghe mẫu asset/TTS trong record_voice | Không tích hợp provider trả phí, không chấm phát âm; không tự hoàn thành bài khi nghe |
| F12 (phụ huynh) | Lỗi GET có retry, không giả thành empty; lỗi playback có thông báo | Phần admin được tích hợp ở đợt bổ sung bên dưới; chưa nghiệm thu production |
| Hồi quy audio | Reset/guard pending microphone theo generation/context; bỏ callback replay đã cũ | Test đổi bài khi permission pending và hai lần replay; chưa thử thiết bị thật |

## TDD và review

1. Backend RED: `legacyGradingPolicy`, `virtualRedemptionConcurrency`, `recordingFinalize`: 15 fail/31 pass. Fail đúng nguyên nhân: client forged true, empty canonical sort/match, gói thiếu active/expiry, 2 debit cùng item, 404 sau request khác commit (cả completed và intent TTL xóa).
2. Backend GREEN: 57/57 của sáu suite liên quan. Concurrency đổi vật phẩm giữ real DB write, chỉ đặt barrier trước update để tái hiện ổn định; test rollback ledger rồi retry vẫn qua.
3. Frontend RED: hai ca model audio thiếu control/subPrompt và hai ca error state bản thu fail. Sau sửa, 35/35 của recording/model/playback/narration qua.
4. Review/simplifier theo ak:cook (vượt ngưỡng số file) tìm được pending-microphone context race mới. Test fail trước, guard/reset sau sửa qua. Không cần refactor cấu trúc.
5. Full run đầu: backend 520/520 qua; client 307/308 vì bắt đúng test RED đang được reviewer bổ sung. Không coi full run này là pass.
6. Reviewer chỉ ra callback của replay cũ; main tái hiện bằng real hook + browser Audio double (false thay vì true), sửa guard player identity. Focused audio cuối 20/20 qua.

## Quyết định/giả định

- Giữ mức thưởng, sao và ngưỡng đỗ 50%; chỉ siết đúng các điều kiện nghiệp vụ đã có. Không sửa lịch sử/ledger cũ.
- Nguồn nghe mẫu là audioUrl hiện có; TTS đọc targetWord, nếu không có thì subPrompt/prompt. Không gọi đó là giọng AI trả phí hoặc ghi nhận phát âm đúng.
- Không gộp bug finalize 404 với thông báo storage unavailable của khách; thông báo đó vẫn cần cấu hình/log/provider và nghiệm thu thật.

## Gate trước bước player/song ngữ

Docs khách mới yêu cầu sai → gợi ý ngôn ngữ hỗ trợ → thử lại cùng câu; đúng → khen tiếng Việt. Nhưng `docs/02-business-rules.md` và API contract ngày 09/10 quy định `multi_select`, `group_sort`, `fill_blanks` phản hồi trung tính, không tiết lộ đáp án, chỉ chấm cuối bài; `follow_steps` chỉ tự xác nhận.

Cần owner chốt ưu tiên Docs mới cho phản hồi từng câu. Đề xuất: server chấm từng câu để hỗ trợ retry/gợi ý, điểm chỉ ghi khi final submit như hiện nay; follow_steps giữ tự báo cáo. Đây là thay đổi contract/hành vi có ý nghĩa, chưa tự triển khai trong đợt integrity.

Sau chốt: cập nhật quy tắc/contract, thực hiện player rồi ánh xạ đúng bản dịch đã có trong Docs mới (không chờ khách gửi lại); tiếp tục curriculum/tiến độ/huy hiệu/UI/admin và vận hành theo plan. Provider voice, công thức điểm học tập và quyền xuất bản vẫn là gate riêng, không xóa khỏi checklist.

## Kiểm chứng cuối

- Lần chạy cuối `npm test` sau tất cả sửa: exit 0; backend 520/520 (53 suite), frontend 309/309 (36 suite). Không còn failure pending-permission ở lần chạy trước.
- `npm run typecheck` và `npm run build`: server/client qua. `npm run lint`: 0 lỗi, còn 103 cảnh báo có sẵn; không tuyên bố lint không có cảnh báo.
- `git diff --check` qua; không commit/push/deploy, không ghi DB production.
- Chưa nghiệm thu browser route có đăng nhập, iOS/Android thật, Cloudinary hoặc production. Test browser Audio double/TTS control không chứng minh chất lượng giọng đọc thực tế.
- Đợt integrity và audio nêu trên đã kiểm chứng local; toàn bộ yêu cầu khách hàng vẫn chưa hoàn tất. Chờ quyết định nghiệp vụ ở gate player/song ngữ trước khi thay contract chấm từng câu.

## Bổ sung F01: xếp lại sau khi chọn hết thẻ sai

- Phạm vi độc lập với gate nghiệp vụ: `SortOrderActivity.tsx` và `sortOrderActivity.test.tsx`; không sửa admin, API, quy tắc chấm/tim/điểm hoặc `LessonPlayerPage`.
- Nguyên nhân: điều kiện hiện nút chỉ cho `selectedItems.length < targetOrder.length`, nên chọn hết thẻ sai mất mọi control sửa câu trả lời.
- Quyết định kỹ thuật: cho reset nếu đã chọn ít nhất một thẻ và chưa hoàn thành đúng. Giữ ẩn khi đúng; reset chỉ khôi phục thẻ local, không gọi `onComplete`. Chọn đủ lần tiếp theo gọi callback như cũ, không tự hoàn tim hay cộng điểm.
- TDD RED: 2 fail/3 pass, cả hai lỗi thiếu nút "Xếp lại" sau lượt sai. GREEN: 5/5, bao phủ sai → reset → đúng, không gọi callback lúc reset, và giữ đủ các thẻ trùng chữ với `orderedItems` legacy. Bộ liên quan sort/navigation/CMS preview 15/15 qua.
- F01 vẫn mở phần tiếp tục khi sai/gợi ý ngôn ngữ/bắt buộc làm lại; không dùng bản sửa reset để tuyên bố đã tuân thủ toàn bộ Docs. Chưa nghiệm thu route đăng nhập hay thiết bị thật.
- Kiểm chứng cuối sau sửa reset: `npm test` exit 0, backend 520/520 (53 suite), frontend 311/311 (36 suite). Client typecheck/build qua; lint 0 lỗi, 103 cảnh báo có sẵn; `git diff --check` qua.
- Phối hợp tránh trùng: chat đồng hành nhận F08 và F12 admin trong worktree riêng (AdminLearnersPage, test adminLearnerDetail, docs/admin-learner-progress.md, report riêng). Đã tích hợp local ở đợt bổ sung bên dưới; các số test trước mục này thuộc các mốc kiểm chứng trước tích hợp admin, không sửa lại lịch sử.

## Bổ sung tích hợp admin và chuẩn bị PR — 2026-10-18

- F08 và phần admin của F12 đã tích hợp local: giữ giá trị 0 điểm/0 sao, status từ server, giới hạn 0 là không giới hạn; thiếu dữ liệu không suy đoán thành tích. Lỗi tải chi tiết có thông báo/retry; hồ sơ không tồn tại có thông báo riêng. Không đổi nghiệp vụ, API, quyền hoặc schema. Tài liệu hiện hành: `docs/admin-learner-progress.md`.
- Bằng chứng do chat đồng hành bàn giao tại `plans/reports/2026-10-18-parallel-customer-completion.md` và `plans/journals/2026-10-18-admin-learner-progress.md`: admin RED 10 fail/4 pass, GREEN 14/14; bản kết hợp frontend 325/325 (37 suite), client typecheck/build và diff-check qua. Đây là kết quả đã ghi từ chat đồng hành, không phải lượt kiểm chứng mới của người cập nhật journal.
- Owner yêu cầu tạo PR và merge phần đã hoàn thành. Handoff điều phối hiện tại giới hạn bước này ở **chuẩn bị/tạo PR rồi dừng trước merge**; tại thời điểm ghi mục này chưa có PR được tạo, chưa merge/deploy. Coordinator theo dõi kết quả review/test mới và bàn giao trạng thái PR riêng.
- Chuẩn bị trong worktree `C:/Users/Asus/.codex/worktrees/customer-audit-ship/codeDuAN`; không sửa checkout dùng chung trong lượt cập nhật này. Loại khỏi phạm vi ship: `.superpowers/`, `plans/261012-user-qa/`, `plans/261018-public-header/` và thay đổi public header ngoài phạm vi bàn giao.
- Metadata phiên bản root là `1.0.1`; không thay dependency. Lượt kiểm chứng fresh trên worktree ship do tester phụ trách, chưa ghi nhận kết quả tương lai vào journal.
- F01 chỉ hoàn thành phần reset; quy tắc bắt buộc retry/gợi ý và F13 song ngữ vẫn chờ chốt. Provider/giọng đọc, curriculum và nghiệm thu production còn mở; toàn bộ kế hoạch vẫn chỉ hoàn thành một phần.
- CLI `ak` không khả dụng: lưu evidence Markdown local, không sửa tay trạng thái/index kế hoạch hoặc tuyên bố plan đã đóng. AgentWiki publish skipped.

## Kiểm chứng bản PR cô lập — 2026-10-18

- Nhánh `codex/customer-audit-ready`, base `main@35c51ca`; chỉ 32 file đã đối chiếu. Không có PublicLayout/public-header, offline-sync hoặc thay đổi của chat khác.
- Tester chạy fresh: `npm test` exit 0, server 520/520 (53 file), client 325/325 (37 file); `npm run typecheck`, `npm run build`, `npm run lint` đều exit 0. Lint 0 lỗi, 103 cảnh báo có sẵn.
- `npm ci` qua sau khi bỏ riêng tải Mongo ở postinstall; test thật dùng binary MongoDB 7.0.24 đã có và DB replica-set tạm. Không chép `.env`, không dùng DB thật. Dependency không đổi; audit có dev dependencies báo 10 lỗ hổng (3 moderate, 5 high, 2 critical), `npm audit --omit=dev` báo 0.
- Reviewer độc lập không còn actionable findings sau đối chiếu code/test/docs; tự chạy 39/39 test client liên quan. Root kiểm tra staged scope, secret-keyword matches và `git diff --cached --check`; một dòng trống EOF trong báo cáo được dọn, không đổi nội dung review.
- Kết quả này hỗ trợ tạo PR; CI GitHub và quyết định merge do điều phối theo dõi riêng. Chưa tuyên bố nghiệm thu thiết bị/audio/provider/production hoặc đóng toàn bộ kế hoạch.

## PR #12: kiểm tra lại sau khi tích hợp main — 2026-10-18

- Coordinator đang tích hợp `origin/main@0b8dd3c` (đã có PR #11) vào worktree ship. Đây là bước cập nhật nhánh PR #12 theo main mới, không phải tuyên bố PR #12 đã merge vào main.
- Xung đột `docs/03-feature-inventory.md` và `docs/06-review-findings.md` được coordinator xử lý và stage, giữ cả phần audit lẫn phần tài liệu từ main. Không bỏ nội dung của PR #11 để giải quyết xung đột.
- Theo bàn giao review, không có actionable findings; các file public header giống `origin/main`. Diff PR vẫn là 32 file thuộc audit: header đi theo base mới, không trở thành thay đổi audit mới. Các exclusions, quyền sở hữu file và giới hạn nghiệp vụ đã ghi trước đó được giữ nguyên.
- Tester báo fresh `npm run typecheck`, `npm run build`, `npm run lint` trên cây sau tích hợp đều exit 0; lint 0 lỗi, 103 cảnh báo có sẵn. Đây là bằng chứng tester bàn giao, không phải lượt chạy của người cập nhật journal.
- Tại thời điểm ghi mục này, full `npm test` và lượt browser header 68 ca vẫn đang chạy; chưa có kết quả cuối để ghi pass. CI GitHub trên commit cập nhật cũng là gate riêng. Coordinator bổ sung kết quả thực tế sau khi nhận đủ, không dùng số test lịch sử ở các mục trước thay cho kiểm chứng cây mới.
- Chat triển khai này cập nhật commit/push của PR #12; chat điều phối giữ quyền review và quyết định merge vào main. Không bật auto-merge hoặc deploy trong bước này. F01 phần retry/gợi ý, F13 và các gate nội dung/audio/thiết bị/production vẫn mở; toàn bộ kế hoạch chưa hoàn thành.
- Kết quả sau đó do tester bàn giao: full `npm test` exit 0, server 520/520 (53 file), client 325/325 (37 file). Header browser smoke đạt 68/68 trên Chrome thật, font/CSS thật, khách/phụ huynh và VI/EN ở 17 chiều rộng 320-1920px; không sửa test. Lượt smoke đầu timeout chờ tải trang sau 4 ca qua, chưa gặp lỗi bố cục; một lượt chạy lại nguyên script sau khi full suite kết thúc qua toàn bộ. Giữ lỗi môi trường lần đầu trong evidence, không coi đó là pass.
- Root xác nhận code audit không đổi so với head đã review `4ea2e61`, header khớp main mới, không còn unmerged entries/conflict markers và diff-check qua. CI/preview trên commit mới vẫn phải kiểm tra riêng sau push; kết quả CI cũ không thay thế gate này.
