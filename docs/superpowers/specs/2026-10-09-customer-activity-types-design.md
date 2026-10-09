# Thiết kế bốn dạng hoạt động học theo nguồn khách hàng

Ngày: 2026-10-09 (Asia/Saigon). Trạng thái: **spec và implementation plan đã duyệt, bốn activity đã triển khai local**; kiểm chứng và giới hạn ở [QA](../../08-customer-alignment.md). Chưa thay dữ liệu DB thật hoặc publish production.

## 1. Mục tiêu và phạm vi được duyệt

Hỗ trợ chọn nhiều chữ/đáp án, phân nhóm nhiều-về-một, nhiều ô trống, nghe và thực hiện 1–3 bước trong Vietverse. Mỗi dạng có model/schema, kiểm publish, chấm server, màn bé, CMS editor, preview và khả năng giữ câu trả lời trong session/outbox phiên bản cố định.

Người dùng đã đồng ý: thêm loại mới, giữ nguyên bảy loại cũ; không đổi công thức điểm/mở khóa; không tự ghi đè các nháp đã nhập. Nghe–thực hiện là **bé tự xác nhận**, không phải hệ thống chứng minh động tác ngoài đời.

Nguồn chuẩn:

- [Quy tắc nghiệp vụ](../../02-business-rules.md), [API/data](../../05-api-and-data-contracts.md), [rủi ro đã biết](../../06-review-findings.md).
- [Snapshot giáo án](../../customer-source/2026-10-09/explore.md), [coverage](../../customer-source/2026-10-09/coverage.md), [manifest/checksum](../../customer-source/2026-10-09/manifest.json).
- [CMS vận hành](../../cms-operations.md), [thiết kế CMS đang dùng](./2026-10-09-cms-design.md).

Không nằm trong phạm vi: import DB thật, bật publish, tạo audio/bản quyền, chấm phát âm AI, camera/micro để chứng minh động tác, thay policy pointsWeight hoặc sửa renderer cũ không liên quan.

## 2. Bằng chứng nguồn và ranh giới ánh xạ

| Dạng | Ngữ liệu đã thấy trong snapshot | Ánh xạ được phép |
| --- | --- | --- |
| Chọn nhiều | Bài 5: `A – M – B – M – C – M`, yêu cầu chọn các chữ M | Sáu lựa chọn ID khác nhau, đáp án là ba ID của chữ M |
| Phân nhóm | Bài 6: nhóm M `mẹ – mèo – mũ`, nhóm B `bà – bé – bóng` | Sáu item, hai group, mỗi item gắn đúng group; không thêm từ ngoài nguồn |
| Nghe–thực hiện | Bài 4: “Bé đứng lên. Bé đi đến bàn. Bé ngồi xuống.”; bé bấm hoàn thành | Ba step giữ nguyên thứ tự, xác nhận tự báo cáo; audio chưa có phải ghi rõ |
| Nhiều ô trống | Bài 11 nêu `c_ _ → cá`, chưa xác định rõ hai ô tương ứng âm/ký tự nào | Xây renderer/editor/chấm điểm; không tự ánh xạ đáp án mơ hồ. Admin bổ sung cấu trúc slot sau khi content owner duyệt |

Ví dụ dữ liệu nhiều ô trong spec/test chỉ là **fixture kỹ thuật**, không được đưa vào snapshot hoặc gọi là lời khách hàng. Các câu chưa có lựa chọn/đáp án/audio hoặc bài 15/20 chưa đủ nội dung tiếp tục giữ ghi chú, không tuyên bố đã production-ready.

## 3. Các phương án và quyết định thiết kế

1. **Chọn: thêm bốn type độc lập** vào contract hoạt động hiện hữu. Có validator/grader/component riêng, giữ hành vi cũ và dễ nhận biết snapshot. Tốn thêm bốn renderer nhưng không ép dạng mới vào cấu trúc một-đáp-án/một-cặp.
2. Không chọn sửa nghĩa của `listen_choose/drag_match/fill_blank`: có nguy cơ làm đổi bài/session/snapshot cũ và tạo đáp án dạng chuỗi/mảng không rõ nghĩa.
3. Không chọn chỉ thêm UI mà dùng `isCorrect` client: không đáp ứng chấm server và dễ ghi điểm sai.

Mở rộng endpoint/schema hiện hữu, không tạo hệ thống lesson hay ledger thứ hai. Không có migration rewrite live/revisions. Publish loại mới phải đợi backend reader/grader và frontend renderer tương ứng đã deploy, theo rollout ở mục 10.

Vì browser client cũ có thể còn mở/cached, chỉ deploy code mới chưa đủ an toàn. `GET /lessons/:id` thêm query capability tùy chọn `activityContract=2`: client mới gửi giá trị này; thiếu query nghĩa là chỉ hỗ trợ bảy type cũ. Nếu snapshot được yêu cầu chứa type mới mà client chưa khai capability, server trả `409 ACTIVITY_CLIENT_UPDATE_REQUIRED`, không trả payload để client cũ fallback nhầm thành Review. Bài/snapshot chỉ có type cũ vẫn đọc được khi thiếu query. Query có giá trị khác `2` bị validation từ chối; không tự nâng session/version hoặc cấp unlock.

## 4. Contract dữ liệu mới

Type identifiers: `multi_select`, `group_sort`, `fill_blanks`, `follow_steps`. Giữ nguyên `word_card`, `listen_choose`, `drag_match`, `fill_blank`, `sort_order`, `record_voice`, `review`.

Dùng lại `id`, `prompt`, `subPrompt`, `audioUrl`, `imageUrl`, `hints` và metadata hiện có. Chỉ fields của type mới được thêm vào DTO; không lưu dữ liệu học tập trong content. Activity ID vẫn do CMS server cấp, contentVersion/draftVersion và luật retiredActivityIds không đổi.

Các ID option/group/slot/step mới: 1–64 ký tự ASCII chữ/số/`_`/`-`; duy nhất đúng phạm vi hoạt động; cấm `__proto__`, `prototype`, `constructor` làm key map. Không áp giới hạn ID mới này ngược lên bản legacy. Khi thêm/xóa/reorder trong CMS, không tái sử dụng ID của item khác hoặc âm thầm gán lại đáp án.

### 4.1 `multi_select`

- `options`: 2–12 option `{id,text,imageUrl?,audioUrl?}`; `text`/nội dung hiển thị có thể lặp (ba chữ M), ID không được lặp.
- `correctAnswer`: mảng 1–12 option ID duy nhất, thuộc options. Không suy ID bằng `text` và không áp validator cấm text trùng của loại chọn một.
- `userAnswer`: mảng option ID đã chọn. Thứ tự chọn không quan trọng; thiếu, thừa, trùng ID, ID không tồn tại hoặc dạng dữ liệu khác đều không đạt.

Fixture nguồn bài 5: IDs `letter-1`…`letter-6`; texts `A,M,B,M,C,M`; `correctAnswer=["letter-2","letter-4","letter-6"]`.

### 4.2 `group_sort`

- `groups`: 2–6 `{id,label}`; label không rỗng, duy nhất sau NFC/trim/lowercase.
- `options`: 2–12 item có ID như multi_select; text item có thể giống nhau nhưng ID khác.
- `correctAnswer`: map **đúng một entry cho mỗi item ID** → group ID hiện hữu. Group được chứa nhiều item; không có khóa lạ hoặc ID nhóm không tồn tại.
- `userAnswer`: map item ID → group ID; cần đúng toàn bộ item, không thiếu/thừa. Không dùng chỉ số hiển thị hoặc chuỗi text làm identity; không chấp nhận array/map prototype hoặc key được kế thừa để tính đúng.

Nguồn bài 6: nhóm `group-m`/`group-b`; sáu item mẹ/mèo/mũ/bà/bé/bóng gắn nhóm tương ứng. Item có thể chuyển sang group khác trước khi gửi.

### 4.3 `fill_blanks`

- `template`: string tối đa 5000 ký tự, marker minh bạch `{{slot-id}}`.
- `blankSlots`: 2–6 `{id,label,acceptedAnswers:string[]}`. Mỗi label không rỗng, 1–4 đáp án được content owner duyệt, mỗi đáp án 1–200 ký tự sau trim. Không thêm synonym ngoài nguồn tự động.
- Mỗi slot xuất hiện **đúng một lần** trong template; mọi marker phải có slot, mọi slot phải có marker, cấm marker không đúng cú pháp/ID. Không tự phân đoạn `__`, không thay hành vi một ô `fill_blank` cũ.
- `userAnswer`: map slot ID → chuỗi nhập; key set phải khớp chính xác toàn bộ slot. NFC, trim và lowercase tiếng Việt khi đối chiếu; **không bỏ dấu, không tự bỏ khoảng trắng bên trong hoặc punctuation**.
- Đạt khi mọi ô khớp một acceptedAnswer của chính ô. Không chia điểm từng ô, không tính đáp án của ô này cho ô khác.

Fixture kỹ thuật (không phải dữ liệu khách hàng): template `Bé {{verb}} {{object}}.`; slots `verb` có `đọc`, `object` có `sách`.

### 4.4 `follow_steps`

- `steps`: 1–3 `{id,text}` có thứ tự, text không rỗng, tối đa 500 ký tự. Activity audioUrl là audio toàn yêu cầu, không tự bịa timestamp/duration hoặc audio từng step.
- `userAnswer`: mảng step ID đã tự xác nhận, đúng đủ thứ tự tác giả; trùng/thiếu/thừa/đảo thứ tự/ID lạ không đạt.
- Bé đánh dấu từng step, có thể bỏ đánh dấu trước khi gửi; nút hoàn thành chỉ dùng được khi đã xác nhận hết bước. Không dùng boolean `true` hoặc `isCorrect` để cấp tín chỉ mới.
- Server chỉ chứng thực **cấu trúc xác nhận** khớp nội dung; không xác minh đứng/ngồi/đi, nghe audio thật hoặc thời gian thực hiện. Việc cố tình gửi đủ ID vẫn là tự báo cáo, không được mô tả là xác thực hành động.

UI ghi “Bé tự xác nhận đã thực hiện”; không gọi là kiểm tra vận động/phát âm. Không xin camera/micro. Nếu audio thiếu/lỗi, hiển thị lời hướng dẫn và nhãn thiếu audio; TTS nếu dùng lại component có sẵn phải có nhãn giọng máy và chỉ sau thao tác chủ động, không giả làm audio khách hàng.

## 5. Chấm điểm, quyền và response

`POST /lessons/:id/complete` giữ envelope `{childId,contentVersion,answers:[{activityId,userAnswer,...}]}`. Shape userAnswer của từng loại mới theo mục 4. `scorePercent`/`isCorrect` từ client không cấp quyền hoặc quyết định đúng sai cho bốn loại mới; missing/malformed answer không đạt, không fallback boolean.

Grader dùng canonical payload snapshot đúng version, không dùng DTO đã loại đáp án gửi xuống client. Không chấp nhận answers của activity/child/lesson/version khác. Câu trả lời lặp cho cùng activity cần bị từ chối rõ ràng, không chọn kết quả đầu/cuối để vượt chấm.

Mỗi activity mới đạt/không đạt toàn bộ, đóng góp vào số activity đúng như hiện tại. Giữ scorePercent theo toàn bài, mốc đỗ 50%, sao 70%/90%, reward một lần theo child/content ID, replay/idempotency và quyền subscription/unlock/ownership. Không reset progress/ledger khi thêm type hoặc xuất bản phiên bản mới.

**Quyết định hiển thị mới (đã duyệt):** không gửi `correctAnswer` của multi/group hoặc `acceptedAnswers` của fill xuống API dành cho bé; CMS admin và canonical snapshot vẫn có chúng. GET lesson tạo learner projection riêng, không dùng projection đó trong grader/publish hoặc sửa snapshot.

Ba dạng câu hỏi mới phản hồi sau thao tác bằng “Đã ghi câu trả lời”, cho phép tiếp tục; không khẳng định đúng hoặc trừ tim dựa trên dữ liệu không có đáp án. Kết quả toàn bài/sao/điểm chỉ từ response server sau nộp. Không thêm endpoint chấm từng câu trong phạm vi này. Bảy loại cũ giữ phản hồi hiện tại; hardening đáp án của chúng là đợt riêng, không làm hỏng contract cũ.

`follow_steps` phản hồi “Đã ghi xác nhận của bé”; không gọi là đã kiểm chứng hành động. `ActivityAnswer.isCorrect` cần hỗ trợ optional/neutral cho loại mới; nếu callback cũ đang nhận boolean, thêm adapter/kết quả trung tính có type rõ để không tự đánh dấu submitted=correct trong UI/session.

Không có thưởng/cuối bài thành công giả khi offline. Outbox lưu đúng shape/version/owner, chỉ có kết quả chính thức sau server xác nhận như hiện tại.

## 6. UX màn bé và phiên học

- Multi: checkbox/toggle có accessible name phân biệt vị trí khi text giống nhau; nhãn như “Chữ M, vị trí 2”, trạng thái selected nhìn rõ; chọn lại bỏ chọn. Có nút gửi riêng, không advance sau một click.
- Group: chọn item rồi chọn group, có thể sửa; group không bị khóa khi đã có item. Hiển thị item chưa phân nhóm, không bắt buộc drag gesture. Button/select tương tác được bằng touch và bàn phím.
- Fill: label riêng cho mỗi ô, hiển thị đủ vế trước/giữa/sau, không mất dấu câu; không encode expected answer trong label, DOM hidden field hoặc template gửi xuống bé.
- Steps: danh sách có thứ tự và nhãn tự xác nhận; audio play/pause/lỗi theo pattern hiện tại, không autoplay; không sensor tracking.
- Touch target tối thiểu 44px, responsive 390px/1366px không tràn toàn trang, focus rõ, lỗi/empty/thiếu data hiển thị có nghĩa. Type không nhận biết/renderer thiếu không được fallback sang Review rồi tự cấp đạt.
- Lưu input chưa gửi vào session theo activity ID/version/child, không chỉ câu trả lời đã bấm gửi; reload đổi phiên/version không gán input cũ vào activity mới. Session cũ thiếu field mới vẫn đọc được. Đổi tài khoản/hồ sơ không render draft answer của bé cũ.
- Khi đổi activity/reset/preview version, reset state đúng identity; stable ID tồn tại qua reorder. Không shuffle làm đổi đáp án hoặc vị trí slot. Preview không ghi session/outbox/progress/points và không xin micro.

## 7. CMS, draft và validate publish

CMS thêm bốn lựa chọn type có tên tiếng Việt; mỗi form có thêm/xóa/reorder phù hợp, ID do server cấp/quản lý, đáp án liên kết bằng ID. Source notes cạnh field/group và summary không bị mất.

Lưu draft cho phép chưa biên tập xong: fields có default an toàn, ID/reference chứa dữ liệu sai cấu trúc bị từ chối; thiếu câu/đáp án hợp lệ là lỗi publish theo field. Publish bắt đủ giới hạn/đáp án/key set/mapping/template của mục 4. Không silently loại key/answer sai và coi là đã sửa.

Khi xóa option/group/slot, editor phải làm rõ liên kết đáp án cần sửa; không chọn đáp án khác tự động. Khi đổi type, trường riêng cũ không còn được dùng để chấm; giữ prompt/media/hints chung, tác giả chủ động xác nhận dữ liệu riêng type bị thay. Conflict/CAS/dirty navigation giữ nguyên như CMS hiện tại.

Preview dùng cùng renderer interaction nhưng chỉ local; có thể hiển thị vấn đề validate và đáp án dành cho admin ở vùng riêng, không làm renderer bé phụ thuộc đáp án canonical. Không tự ghi kết quả preview vào child API.

## 8. Nguồn/importer và compatibility

Thêm vào catalog cho **lần nhập mới** những hoạt động nguồn đầy đủ: bài 4 steps, bài 5 multi, bài 6 groups; ghi rõ notes đã thay đổi cho từng bài. Không xóa generic unsupported note nếu bài còn thao tác chưa hỗ trợ khác (ví dụ kéo từ vào câu).

Không sửa snapshot/manifest/checksum vì thay cách ánh xạ. Importer hiện nhận diện lần nhập theo key + checksum toàn file, nên DB đã nhập cùng nguồn sẽ **skip** dù code catalog đã thêm type. Không đổi requestId/checksum/identity nhằm ép re-import, không ghi đè payload đã được người khác sửa.

Các nháp đã nhập: admin bổ sung dạng mới thủ công bằng CMS sau duyệt và save CAS; batch upgrade/migration nháp phải là kế hoạch riêng, không có trong đợt này. Runbook nhập DB phải bổ sung ghi chú SHA catalog và skip semantics khi triển khai xong.

Giữ bảy loại cũ, snapshot legacy/order >20/media HTTP đọc được, fill_blank một marker cũ. Reader whitelist nhận fields mới của canonical author payload nhưng learner projection mới loại expected fields. Không migration/rewrite live, source hoặc revisions. Model schema live hỗ trợ thêm type trước khi được publish.

## 9. Thành phần và file boundaries dự kiến

**Backend:**

- `server/src/models/Lesson.ts`: thêm type/fields mới, không đổi lesson identity.
- `server/src/modules/content/content.validation.ts`: draft/publish rules riêng type, chống ID/reference/template sai và map unsafe keys.
- `server/src/modules/content/content.read-schema.ts`, `content.dto.ts`: giữ canonical type mới và thêm learner projection riêng không lộ expected fields.
- `server/src/modules/lessons/lessons.grading.ts`, `lessons.service.ts`, `lessons.validation.ts`: grader typed, strict submissions/duplicate guard; giữ reward/version policies.
- `server/src/modules/admin/admin.validation.ts`: whitelist type đồng bộ nếu API legacy schema vẫn kiểm types; endpoint cũ vẫn không ghi live.
- `server/src/seeds/customer/customerCatalog.ts`: mappings nguồn đủ rõ, notes giới hạn; không apply dữ liệu thật.

**Frontend:**

- `client/src/features/lesson-player/activities/`: bốn component mới, helper state/answer thuần nếu cần; không gộp cả bốn vào một component lớn.
- `client/src/features/lesson-player/activityRegistry.ts`, `LessonPlayerPage.tsx`: đăng ký renderer, trạng thái submitted/acknowledged trung tính, unknown type không cấp đạt.
- `client/src/store/lessonSessionStore.ts`, session/outbox consumers: persistence input mới, backward-compatible envelope và account/version boundaries.
- `client/src/features/admin/content/content.types.ts`, `ActivityEditor.tsx`, `LessonEditor.tsx`, `LessonPreview.tsx`: author forms và registry preview. Tách form mới theo type nếu editor hiện tại quá lớn; không refactor unrelated UI.

**Docs/tests:** cập nhật `02-business-rules`, `03-feature-inventory`, `05-api-and-data-contracts`, `06-review-findings`, `coverage`, `cms-operations`/runbook đúng tình trạng đã kiểm chứng. Không dùng trạng thái “hoàn thiện” để bao gồm DB thật/asset còn thiếu.

## 10. Rollout/rollback

1. Code/test trên MongoDB replica set tạm, không dùng credentials DB thật.
2. Deploy backend model/canonical reader/learner projection/grader và frontend CMS/player/session/outbox cùng release tương thích. Giữ publish false tới khi cả hai đích đã được xác minh, không publish type mới khi browser client cũ còn được phục vụ.
3. Giữ source/drafts/revisions cũ; nghiệm thu trên staging theo version/owner/session/offline và registry mới. Người deploy DB dùng runbook hiện hữu riêng, không tự gọi import trong feature release.
4. Admin chỉ publish bản đã validate/duyệt, chưa sẵn audio/ngữ liệu thì vẫn giữ nháp. Đợt này không bật flag production.

Rollback trước publish type mới: có thể revert feature code sau kiểm tra chưa có live/revision/session mới cần đọc; giữ dữ liệu nháp, không xóa chúng để né schema. Nếu đã publish type mới, không hạ reader/grader về phiên bản không hiểu chúng: tắt publish, giữ compatibility code và mở change khôi phục nội dung qua version mới. Không rollback ledger/progress.

## 11. Tiêu chí nghiệm thu và kiểm thử phải có trong plan

- Test-first grader/validate: multi chọn đủ/thiếu/thừa/trùng/unknown ID và text giống nhau; group many-to-one, missing/extra item/unknown group/prototype keys; fill đủ/missing/swapped slot, NFC/case, không bỏ dấu, malformed/unmapped/duplicate marker; steps đủ thứ tự/thiếu/đảo/trùng/boolean forgery.
- API GET bé không có expected fields mới; snapshot canonical/admin preview vẫn đủ chấm; `isCorrect:true` không vượt grader; user/child/lesson/version không hợp lệ bị chặn; duplicate activity submission không tạo điểm.
- Client không khai capability vẫn đọc bài/snapshot bảy type cũ; snapshot có type mới trả `409 ACTIVITY_CLIENT_UPDATE_REQUIRED`; client có `activityContract=2` nhận learner DTO mới. Không thay requirement contentVersion trên complete/outbox.
- Publish/read snapshot mới; bé đang mở phiên bản cũ vẫn hoàn thành đúng; replay/version không nhân thưởng. Bảy loại cũ và catalog legacy được test hồi quy.
- UI/CMS: checkbox chữ M theo vị trí, gán nhiều item cùng group, sửa nhóm, input mọi slot, không mất vế câu, bước tự xác nhận/thiếu audio/lỗi audio; gửi một lần, sửa đáp án trước gửi, neutral feedback và không trừ tim giả; admin fields/reference errors/CAS/source notes/preview không mutation.
- Persistence: partial input qua reload, typed submitted answer qua offline/outbox, không biến mất khi storage/API lỗi, không gán nhầm tài khoản/child/version, không báo điểm cuối trước server.
- Source catalog: bài 4/5/6 chứa đúng ngữ liệu/ID mới, checksum nguồn unchanged; c_ _ bài 11 giữ note chưa ánh xạ; re-import same checksum skip và giữ sửa tay.
- Full `npm test`, `npm run typecheck`, `npm run build`, lint frontend và whitespace check; báo warnings thật, không che đỏ bằng cách giảm assertions.
- Browser 390px/1366px keyboard/touch/focus/overflow, console/pageerror; không gọi production payment/DB/micro. Nếu browser automation còn lỗi, báo limitation và không coi unit tests là chứng nhận mobile/Safari/axe.

## 12. Những quyết định đã duyệt và giả định triển khai

Đã duyệt trong chat: bốn type mới, server chấm chính thức, compatible types cũ, không đổi điểm/unlock và follow_steps tự báo cáo.

Chi tiết đã được duyệt trong bản spec này: exact type/field names và bounds; template slot tường minh thay underscore; grade đúng toàn activity; chấm ở cuối bài và phản hồi trung tính cho loại mới để không lộ đáp án; GET capability bảo vệ client cũ; persistence partial input; chỉ ánh xạ nguồn đầy đủ cho lần nhập mới, không tự update drafts đã nhập.

Giả định: content owner duyệt acceptedAnswers/dị bản/ngữ liệu còn thiếu; thiết bị có trình duyệt hỗ trợ giao diện hiện tại nhưng không giả định audio/TTS luôn khả dụng; DB production vẫn do deploy owner xử lý theo runbook riêng.

Bản spec và [implementation plan](../plans/2026-10-09-customer-activity-types.md) đã được duyệt, thực hiện TDD inline theo người dùng chọn. Nếu muốn phản hồi đúng/sai từng câu mới ngay lập tức, cần thiết kế endpoint chấm từng activity có ownership/version/rate limit và phân tích offline riêng; không tự thêm vào phạm vi này.
