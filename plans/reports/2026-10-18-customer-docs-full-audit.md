# Rà soát toàn bộ tài liệu khách hàng Vietverse — bản code mới nhất

Ngày đối chiếu: 18/10/2026. Phạm vi: review/diagnosis, không sửa nghiệp vụ hoặc dữ liệu production.

**Theo dõi sau review:** owner đã yêu cầu triển khai. Các bản sửa local tiếp theo được ghi riêng trong [journal thực hiện](../journals/2026-10-18-customer-completion.md). Báo cáo bên dưới giữ kết quả tại baseline 35c51ca, không ghi đè lịch sử và không đồng nghĩa các sửa local đã lên production.

## 1. Kết luận và phiên bản

**Chưa đạt mức hoàn chỉnh theo toàn bộ Google Docs của khách.** Đã có nhiều chức năng và bản sửa thực sự, nhưng giáo án tương tác, yêu cầu song ngữ, giọng đọc ổn định, nghiệm thu lưu thu âm và một số quy tắc điểm/tiến độ vẫn chưa đáp ứng đầy đủ.

- Code: `main@35c51ca3072f24a674431aa9c0e683ace9d3d8b3`, merge PR #10.
- Đã đọc remote bằng `git ls-remote`: HEAD và `origin/main` cùng commit này tại thời điểm kiểm tra.
- Tree của `35c51ca` và bản đã review `39ec37a` cùng `3a2bb812e35eaf3342d95311a669d0c9affc1e34`. Merge không đổi nội dung file; các phát hiện trước vẫn áp dụng.
- Không đồng nhất code mới nhất với bản đang chạy trên website. Chưa xác nhận revision, môi trường và nội dung DB production hiện tại.
- Nguồn khách: [Google Docs](https://docs.google.com/document/d/1Bi_owABMnxrkFRoZQHoIPW0xu_UDPnWJLh2nbHY-VvM/edit?tab=t.gr96comr6i9f).
- Đã đọc 10 tab: Trang chủ, Cấu trúc toàn bộ web, Đăng ký, Khám phá, Kho Truyện, Khám Phá Văn Hóa, Tiến Độ Học Tập, Điểm Thưởng, Footer, Lỗi.
- Đã xem cả 7 ảnh nhúng trong tab Lỗi. Bảng bình luận Google Docs ở chế độ tất cả tab không hiển thị bình luận bổ sung.
- Đối chiếu thêm `docs/README.md`, tài liệu nghiệp vụ/API/kiến trúc, `docs/06-review-findings.md`, alignment, tài liệu audio/translations và các journal liên quan. Snapshot nguồn 09/10 không thay thế bản Google Docs hiện hành.

Quy ước: **Có** = có bằng chứng code/test, không mặc nhiên là đã nghiệm thu production. **Một phần** = có cơ chế nhưng thiếu dữ liệu/hành vi. **Thiếu/sai** = chênh lệch xác nhận từ code. **Chờ xác nhận** = cần quyết định hoặc kiểm chứng ngoài code.

## 2. Các phát hiện cần ưu tiên

| ID | Mức | Phát hiện và ảnh hưởng | Bằng chứng |
| --- | --- | --- | --- |
| F01 | P1 | Trả lời sai vẫn bật nút tiếp tục; không bắt buộc gợi ý đúng ngôn ngữ rồi làm lại cùng câu như Docs. Xếp hết thẻ sai còn mất nút đặt lại. | `client/src/features/lesson-player/LessonPlayerPage.tsx:218`, `:436`; `activities/SortOrderActivity.tsx:79` |
| F02 | P1 | Catalog bootstrap có 20 bài nhưng phần lớn dùng cùng mẫu bài chữ; 84 hoạt động, không có `listen_choose` hoặc `record_voice`. Có TTS ở renderer không có nghĩa giáo án nghe/nói đã đủ. | `server/src/seeds/customer/bootstrapCatalog.ts:79` |
| F03 | P1 | Chưa có tích hợp giọng AI trả phí hoặc bộ audio được duyệt. Thiết bị không có giọng Việt vẫn không nghe được khi thiếu asset. | `client/src/hooks/useNarration.ts:163`; `docs/customer-audio-translations.md` |
| F04 | P1 | Chưa đóng được lỗi lưu thu âm khách chụp. Có rủi ro finalize đồng thời: đọc receipt chưa có, request khác hoàn tất, đọc intent completed rồi trả 404 dù receipt vừa được tạo. | `server/src/modules/recordings/recordings.directUpload.ts:41`; journal đã ghi test chập chờn, chưa có sửa |
| F05 | P1 | Đổi cùng vật phẩm ảo đồng thời có thể trừ điểm hai lần: kiểm tra sở hữu trước atomic update nhưng filter trừ điểm không kiểm tra chưa sở hữu. | `server/src/modules/points/points.service.ts:191`, `:245`; probe service với model giả: 2 lần thành công, 100 → 80, 2 ledger |
| F06 | P1 | Chấm điểm legacy còn tin `isCorrect` từ client khi thiếu đáp án chuẩn; sort thiếu canonical answer tự đúng. Có thể nhận tiến độ/điểm không hợp lệ nếu dữ liệu loại này tồn tại. | `server/src/modules/lessons/lessons.grading.ts:56`, `:97`, `:107`, `:139`, `:146`; probe hàm thuần xác nhận |
| F07 | P2 | Huy hiệu dựa vào số dư 30/50/70/150, không theo chuỗi ngày/5 bản thu/quiz văn hóa/hoàn thành 5 chặng như lời mô tả. Có thể mở sớm hoặc mất mở sau đổi quà. | `client/src/features/points/TreasureRoomPage.tsx:115`; `client/src/i18n/vi.ts:320` |
| F08 | P2 | Admin hiển thị 0 điểm thành 100%, 0 sao thành 3 sao, đang học cũng gắn hoàn thành; không giới hạn thời gian (0) thành 20 phút. | `client/src/features/admin/AdminLearnersPage.tsx:269`, `:302`, `:307`, `:311` |
| F09 | P2 | Bài record_voice không có nút nghe mẫu/audioUrl và bỏ qua subPrompt: thiếu chuỗi nghe mẫu → nói lại → thu. | `client/src/features/lesson-player/activities/RecordVoiceActivity.tsx:18`, `:114` |
| F10 | P2 | Tiến độ thiếu từ vựng đã học, điểm học tập riêng và liên kết xem chi tiết/tiếp tục từng chặng; % năng lực dùng trọng số cố định trên mốc 4 bài. | `client/src/features/parent/ParentJourney.tsx:52`; `server/src/modules/parent/parent.service.ts:129` |
| F11 | P2 | Gói trả phí thiếu active hoặc expiresAt vẫn được chấp nhận, trái điều kiện strict trong tài liệu nghiệp vụ. Không khẳng định DB production có record này. | `server/src/modules/lessons/lessons.policy.ts:12` |
| F12 | P2 | Lỗi tải bản thu bị trình bày như chưa có bản thu; lỗi phát âm thanh im lặng. Lỗi chi tiết học viên thành spinner vô hạn. | `client/src/features/parent/ParentRecordingsPage.tsx:36`, `:59`, `:83`; `client/src/features/admin/AdminLearnersPage.tsx:247` |
| F13 | P1 | Bộ nhập học liệu vẫn đọc snapshot 09/10, trong khi Docs hiện tại đã có nhiều câu hỏi/gợi ý EN/KO/JA/FR/ZH. Activity chỉ có prompt/subPrompt/hints dạng chuỗi, chưa ánh xạ những bản dịch khách đã cung cấp. Không thể coi toàn bộ phần này là chờ khách. | `server/src/seeds/customer/customerSource.ts:5`; `server/src/models/Lesson.ts:28`; đối chiếu tab Khám phá hiện hành |

P1 là ưu tiên sửa/nghiệm thu trước khi tuyên bố hoàn chỉnh; không phải khẳng định mọi lỗi đã xảy ra trên production.

## 3. Đối chiếu 11 ghi chú trong tab Lỗi

| # | Khách ghi | Trạng thái bản mới | Kết luận cụ thể |
| --- | --- | --- | --- |
| 1 | Đổi email chính thức | Có — đã sửa code | Footer dùng `vietverseallsatar@gmail.com`, đúng nguyên văn khách; không tự sửa cách viết email. `PublicLayout.tsx:247`. |
| 2 | Đổi SĐT | Có — đã sửa code | Liên kết `tel:+84868261075`, tương ứng 0868261075. `PublicLayout.tsx:251`. |
| 3 | Mua AI “evernote” để đọc | Chưa thực hiện | Chưa xác định chính xác dịch vụ. Không suy đoán thành ElevenLabs, không mua/gọi dịch vụ hoặc xin mật khẩu trong chat. |
| 4 | Kèm ngôn ngữ hỗ trợ | Một phần | Story/culture có schema, editor và hiển thị bản dịch đã nhập. Bài học chưa ánh xạ nhiều câu hỏi/gợi ý 5 ngôn ngữ đã có trong Docs mới; chỉ phần nguồn thật sự chưa cung cấp mới cần bổ sung/duyệt. |
| 5 | Phần đọc bị lỗi | Chưa đóng | Ảnh cho thấy thiếu giọng `vi-VN`. Đã có xử lý fallback/voice discovery, nhưng thiếu voice và thiếu asset vẫn không đọc được. Chưa nghe thử nghiệm thu đa thiết bị. |
| 6 | Thu âm không lưu | Chưa đóng | Ảnh đã thu 11 giây và nghe lại được; lỗi ở lưu storage. Cần cấu hình/provider logs và kiểm thử lưu rồi mở lại từ phía phụ huynh; còn race F04. |
| 7 | “k đặt đc câu hỏi” | Chờ bước tái hiện | Không có bằng chứng đủ để hiểu là tạo câu hỏi CMS, đặt thẻ câu hay trả lời quiz. Không tự gộp với lỗi thẻ chữ. |
| 8 | Không chạy bài tiếp theo | Có — đã sửa code | Player truyền `onNextLesson`, làm mới cache stages sau submit; bài tiếp theo vẫn theo quyền/unlock phía server. Test điều hướng có. |
| 9 | Chọn English nhưng giao diện Việt | Có theo quyết định VI/EN hiện hành | Có chọn mặc định EN và chuyển giao diện. Lựa chọn VI thủ công được giữ; nội dung tiếng Việt cốt lõi không đổi thành English. Không đồng nghĩa toàn bộ học liệu đã có bản dịch. |
| 10 | Chưa có nút chuyển ngôn ngữ | Có — đã sửa code | VI/EN hiển thị cả mobile khu bé/phụ huynh; không còn `hidden sm:inline-flex`. Có hồi quy CSS thật. |
| 11 | Lỗi hiển thị | Có cho ảnh đã chỉ ra | Ảnh “Bé thương mẹ”: thẻ chữ dùng wrap/min-height/break-words, không còn fixed tile gây chồng chữ. Các journal có kiểm thử desktop/mobile; không tuyên bố mọi màn/thiết bị đều hết lỗi hình học. |

Tổng hợp: **6 mục có sửa trong code, 1 mục mới đáp ứng một phần, 3 mục chưa đủ điều kiện đóng, 1 mục chưa rõ cách tái hiện.** Đây không phải 6 lỗi đã xác nhận hết trên website production.

## 4. Đọc, giọng đọc, thu âm — kiểm tra riêng từng lớp

### 4.1 Những phần thực sự đã có

- Ưu tiên audio asset; nếu cần dùng TTS thì có nhãn fallback, không giả là giọng studio.
- Chỉ một bộ phát hoạt động; đổi nội dung/route/unmount dừng và vô hiệu callback cũ.
- Chọn voice exact locale rồi cùng ngôn ngữ; chuẩn hóa `vi_VN`/`vi-VN`, chờ voice tối đa 1,5 giây.
- Có xử lý khởi động TTS iOS và timeout 2,5 giây khi không bắt đầu; không bảo đảm mọi thiết bị có voice.
- Đọc đoạn dài theo chunk; word card đọc subPrompt riêng, không dùng audio từ đơn thay cho đoạn.
- Story theo dòng khi TTS; timeline/seek chỉ dựa thời lượng media thật. TTS không được trình bày như seek audio có timestamp.
- Micro thu thật và nghe lại Blob; thất bại upload vẫn giữ Blob trong phiên để gửi lại.
- Hoàn thành activity thu âm cần recording receipt hợp lệ gắn child/lesson/version/activity; không tin boolean từ client.
- Upload ký phía server; kiểm tra ownership, metadata provider và persistence transaction.

### 4.2 Vì sao chưa được đóng lỗi đọc

Thông báo trong ảnh là “Thiết bị chưa có giọng đọc vi-VN”, không phải bằng chứng toàn bộ cơ chế phát đã hỏng. Code xử lý đúng việc không dùng nhầm giọng ngoại ngữ, nhưng trải nghiệm khách yêu cầu vẫn chưa đạt nếu thiết bị không có giọng Việt và nội dung chưa có audio.

Đầu vào còn thiếu: tên/link provider khách muốn mua, giọng/vùng miền, tốc độ, quyền dùng, dự toán chi phí; audio/bản dịch được duyệt và quyền xuất bản. Không tự chuyển provider hoặc tự công bố quyền tác giả.

### 4.3 Vì sao chưa được đóng lỗi lưu thu âm

Thông báo trong ảnh trùng `UPLOAD_STORAGE_UNAVAILABLE` tại `server/src/services/directAudioStorage.ts:19`.

- Thiếu một trong Cloudinary cloud name/API key/API secret/recording upload preset gây lỗi này.
- Một số lỗi kiểm tra asset ở provider cũng được ánh xạ về 503; ảnh không đủ phân biệt thiếu env hay provider lỗi.
- Không cần và không nên xuất giá trị secret vào báo cáo.
- Race finalize F04 là lỗi riêng, không khẳng định chính nó gây thông báo trong ảnh.
- Blob hiện không phải bản thu offline bền vững: reload/đóng tab trước khi lưu có thể mất bản chưa gửi.
- Trang phụ huynh cần phân biệt lỗi GET, không có dữ liệu và audio URL không phát được.

### 4.4 Rủi ro cần kiểm chứng thêm

- Xóa bé trong khi signed upload còn hiệu lực có thể để lại asset tải lên muộn: intent bị xóa, cleanup thấy asset chưa tồn tại và hoàn tất trước khi upload tới. Chữ ký còn hiệu lực khoảng 15 phút. Đây là phân tích race tĩnh, chưa tái hiện với provider thật.
- URL audio hiện công khai; cần quyết định quyền riêng tư/retention cho bản thu trẻ em và tác vụ cleanup định kỳ.
- Không có bằng chứng hệ thống chấm phát âm “chuẩn xác” bằng AI; caption huy hiệu không được dùng làm lời hứa chấm phát âm.

Nghiệm thu bắt buộc: nghe từ/đoạn/đồng dao trên desktop + iOS + Android; thiếu voice; asset lỗi; đổi nội dung khi đang nghe; từ chối mic; thu/nghe lại/gửi/retry; mở lại bản thu ở phụ huynh sau reload; finalize đồng thời; xóa bé khi upload đang diễn ra.

## 5. Đối chiếu tuần tự từng phần tài liệu

### 5.1 Trang chủ

| Yêu cầu | Trạng thái |
| --- | --- |
| Hero, thông điệp học/chơi; giới thiệu Vietverse cho trẻ đa ngôn ngữ | Có các section tương ứng; không coi biến thể copy là lỗi chức năng. |
| Bốn khó khăn: thời gian, nội dung, động lực, tương tác | Có nội dung tương ứng. |
| Hành trình trực quan và CTA cuối | Có. |
| Cả ba CTA dẫn đăng ký | Chưa đúng: CTA tới `/bat-dau` hoặc `/kham-pha`, guest qua ProtectedRoute vào đăng nhập, không thẳng đăng ký. Đăng ký vẫn truy cập được. `LandingPage.tsx:68`, `:393`, `:425`. |
| Liên hệ cuối trang | Có; email/SĐT đã sửa. |
| Tuyên bố cá nhân hóa/đánh giá | Copy cá nhân hóa không chứng minh có giáo án riêng theo tuổi; con số rating trên UI cần nguồn/duyệt nội dung, chưa xác minh. |

### 5.2 Cấu trúc website và header

| Yêu cầu | Trạng thái |
| --- | --- |
| Trang chủ, auth, hồ sơ bé, Explore, khóa học, truyện, văn hóa, tiến độ, thưởng | Có các khu vực/route tương ứng. Đường dẫn tiếng Việt khác ví dụ tiếng Anh không tự là lỗi. |
| Header khu bé cố định | Có sticky header. |
| Logo VIETVERSE + tagline trong header khu bé | Chưa đúng cấu trúc yêu cầu. |
| Đủ navigation, gồm Khóa học | Khu bé thiếu liên kết khóa học trong nhóm nav. |
| Nhấn số dư ViVi mở Điểm thưởng | Chưa có: số dư là khối hiển thị, không link. `KidsLayout.tsx:144`. |
| Avatar mở Hồ sơ/Tiến độ/Cài đặt/Đăng xuất | Khác Docs: avatar là chọn/thêm bé; Parent Corner riêng không phải menu mô tả. |
| Năm chặng và mascot | Có nền tảng; lời chào tên bé/định hướng tiếp tục còn thiếu ở bản đồ. |
| Khóa học: quyền lợi/free/tháng/năm | Có trang pricing và backend subscription; giá hiện hành 250.000/tháng, 990.000/năm theo quyết định sau, không dùng giá lịch sử 149.000. |
| Thanh toán thực tế | Có implementation PayOS nhưng cần xác nhận kế hoạch mở bán và nghiệm thu webhook/giao dịch thực tế; health endpoint không chứng minh thanh toán hoạt động. |

### 5.3 Đăng ký và hồ sơ bé

| Yêu cầu | Trạng thái |
| --- | --- |
| Email/mật khẩu/xác nhận mật khẩu | Có. |
| Google | Có GIS và xác minh server thực, không còn placeholder; current production chưa được thử lại. |
| Nhập tên bé | Có. |
| Chọn tuổi 5–6 hoặc 6–8 | Có; chưa đồng nghĩa học liệu thích ứng riêng theo tuổi. |
| Chọn nhiều EN/JA/KO/ZH/FR/khác | Có lưu preference; “khác” chưa đủ locale để tự cung cấp bản dịch/giọng. |
| Giữ tiếng Việt làm nội dung cốt lõi | Có, đúng yêu cầu. |
| Hoàn tất có tên bé, mascot, chuyển Khám phá | Có. |
| An toàn tài khoản | Email chưa xác minh; liên kết Google vào email đã đăng ký cần xử lý nguy cơ preregistration. Còn quyết định reset/password cho Google-only. |

### 5.4 Khám phá — quy tắc dùng chung

| Yêu cầu | Trạng thái |
| --- | --- |
| 5 chặng × 4 bài | Có cấu trúc, chưa tương đương đủ giáo án. |
| Mỗi câu hỏi VI + ngôn ngữ học kèm | Chưa phủ toàn bộ: UI VI/EN không phải bản dịch từng câu hỏi/ngữ liệu. |
| Sai → gợi ý theo ngôn ngữ hỗ trợ → thử lại cùng câu | Sai hành vi hiện tại, xem F01. |
| Đúng → khen tiếng Việt, không thêm gợi ý ngoại ngữ | Chưa đúng: praise theo UI language; hint có thể mở trước/sau cả đúng, state hint không reset theo bài nhỏ. |
| Gợi ý phù hợp ngữ cảnh | Mới hiển thị chuỗi hints; thiếu mô hình bản dịch và điều kiện rõ ràng. |
| Map chặng hiện tại, tiếp tục và trạng thái rõ | Có counts/title/goal/lock; mặc định chặng 1, chưa đủ lời chào tên bé/CTA tiếp tục/trạng thái văn bản như Docs. |
| Hoàn thành Bài 20 mở báu vật | Modal chung, chưa có trải nghiệm riêng/kết quả cuối hành trình tương ứng. |

Ba nguồn dữ liệu cần phân biệt:
- `seeds/catalog.ts`: demo, 119 activities; không phải bằng chứng curriculum khách hoàn chỉnh.
- `customerCatalog.ts`: nháp ánh xạ nguồn, 79 activities; B15/B20 còn rỗng theo chủ ý thiếu ngữ liệu.
- `bootstrapCatalog.ts`: 84 activities text-first đủ validation publish, chưa đủ giáo án. Journal 11/10 có receipt đã nhập 5 chặng/20 bài/21 truyện/8 văn hóa; không dùng receipt cũ để khẳng định payload live hôm nay.

**Nguồn song ngữ đã có, không phải chờ toàn bộ từ khách:** Docs hiện hành có bảng/dòng dịch English, Korean, Japanese, French, Chinese cho nhiều câu hỏi và gợi ý. Ví dụ B1 “Con nghe thấy ai?” và “Mẹ là người thân trong gia đình.”, B17 ba câu hỏi về Lan, B20 đủ năm prompt. Importer lại khóa vào snapshot 09/10 chưa có phần này. Cần nhập/ánh xạ đúng bản mới và xử lý schema/renderer; chỉ yêu cầu khách bổ sung các câu/asset thật sự còn thiếu. Không tự ghi đè snapshot bất biến hoặc publish trong lượt review.

### 5.5 Đối chiếu đủ 20 bài

Các hàng sau so với bootstrap hiện tại. Hoạt động có ở draft không đồng nghĩa đã xuất bản hoặc có trong bootstrap.

| Bài | Phần đã ánh xạ | Thiếu/lệch so với giáo án khách |
| --- | --- | --- |
| 1 — Người xung quanh em | Đoạn gia đình, câu chọn, điền, xếp | Chưa đủ vốn từ gia đình, 3 cặp ghép, bộ ôn 5 câu và nghe nhận diện. |
| 2 — Đồ vật quanh em | Đọc bút/sách/cặp, chọn/điền | Thiếu 3 thẻ riêng, ghép vật–công dụng, kéo từ đúng yêu cầu. |
| 3 — Con vật quanh em | Đoạn mèo/cá/chim, hỏi cá bơi | Thiếu luồng nghe/thẻ/ghép và đầy đủ câu phân loại cá–chim. |
| 4 — Bé làm gì? | Đoạn hành động và follow_steps 3 bước | Thiếu nghe/chọn/kéo tương ứng; follow_steps chỉ tự xác nhận, không xác minh vận động. |
| 5 — Khu chữ cái | Text A/B/M và multi_select đủ 3 M | Thiếu nghe âm, ghép và ôn đầy đủ. |
| 6 — Âm đầu | Đoạn M/B, group_sort mẹ/mèo/mũ – bà/bé/bóng | Thiếu chọn âm đầu từ mẫu nghe. |
| 7 — Sáu thanh điệu | Đoạn 6 thanh, câu hỏi chữ | Thiếu nghe phân biệt, ghép thanh và thu âm “bà”. |
| 8 — Đồng dao cùng Lí Lắc | Trích Dung dăng dung dẻ | Thiếu phân biệt vần bàn/lan, nghe/nhịp và ghi âm theo giáo án. |
| 9 — Ghép chữ thành tiếng | Ghép b+a và ví dụ trong đoạn | Thiếu tiến trình nghe/ghép nhiều tiếng và phụ âm ghép ch/tr/nh/ph. |
| 10 — Ghép tiếng thành từ | Một số cụm từ, điền và xếp | Chỉ một phần bộ ghép; thiếu nghe nhận diện và trình tự đủ. |
| 11 — Chữ nào đang trốn? | Một ô trống và chọn đáp án | Nguồn `c_ _ → cá` chưa rõ cấu trúc slot; không tự suy diễn thành đã có bài nhiều ô trống. |
| 12 — Đọc cùng Lí Lắc | Đoạn ngắn, câu chọn/điền | Thiếu thang từ → cụm → câu và thu âm câu mẫu. |
| 13 — Ai đang làm gì? | Đoạn người–hành động và câu chọn | Thiếu ghép chủ thể–hành động, nghe mẫu/nói/thu âm. |
| 14 — Kể chuyện theo thứ tự | Bốn sự kiện buổi sáng | Xếp sự kiện dài đổi thành chọn thứ tự số; không có kể lại/thu. |
| 15 — Nghe truyện/Bánh chưng bánh giầy | Bản kể ngắn tự biên soạn, câu hỏi | Chưa đủ 7 phần: bối cảnh, nghe/kể, đối thoại, kết thúc, kể lại và tương tác theo giáo án. |
| 16 — Nói chuyện cùng Lí Lắc | Mẫu giới thiệu tên/sở thích dạng chữ | Thiếu chuỗi đầy đủ sở thích/đồ vật/lý do và nói thực tế. |
| 17 — Đọc và tìm thông tin | Đoạn Lan đi chợ giữ ý chính | Chưa đủ bộ câu hỏi tìm thông tin và ôn theo nguồn. |
| 18 — Đọc và hoàn thành câu | Điền từ, câu mẫu | Xếp câu dài bị thay bằng chọn thứ tự số; thiếu thao tác xếp câu đúng nguồn. |
| 19 — Câu đố dân gian | Câu đố mèo/gà | Thiếu nhóm đồ vật/thiên nhiên và giải thích sau đáp án đúng. |
| 20 — Báu vật Nước Nam | 5 câu chữ tổng hợp | Không đủ thử thách nghe/nói/vận dụng; dùng gate chung >=50%, không bảo đảm hoàn thành đúng cả 5 thử thách; modal/huy hiệu không đúng thành tích. |

B15/B20 không được tự điền toàn bộ câu hỏi chưa được khách/giáo viên duyệt. B20 dùng gate >=50% là quyết định nghiệp vụ nội bộ hiện tại: phải thống nhất lại với “hoàn thành 5 thử thách”, không tự đổi quy tắc điểm trong review.

### 5.6 Kho truyện

- Có danh sách/tìm kiếm/lọc, trang chi tiết, đọc chữ, nghe/nghe lại, phần từ vựng và quiz nhẹ.
- Thiếu đường dẫn nội dung/bài học liên quan. Player hiện chỉ lấy `story.quiz?.[0]`; cần quyết định nếu muốn nhiều câu, vì phần quiz trong Docs là tùy chọn.
- Trọng tâm nghe chưa đạt đồng đều khi thiếu audio đã duyệt; timestamps của nguồn đang 0, không phải đồng bộ karaoke đã hoàn thiện.
- Model có đồng dao/cổ tích/thơ/ngụ ngôn, không có nhóm dân gian riêng. Tab Cấu trúc và tab Kho truyện tự khác taxonomy; cần chốt danh mục.
- `StoriesPage.tsx:16` gán mọi loại ngoài đồng dao/cổ tích thành “Thơ ca”; record ngụ ngôn sẽ bị gắn nhãn sai.

Đã đối chiếu đủ danh mục 21 tác phẩm có tên:

| # | Tác phẩm | Tình trạng nguồn/import |
| --- | --- | --- |
| 1 | Trồng nụ trồng hoa | Có lời trong source catalog. |
| 2 | Rồng rắn lên mây | Có. |
| 3 | Hai bàn tay/Mười ngón tay | Có phần lời “Hai bàn tay” khách cung cấp. |
| 4 | Dung dăng dung dẻ | Có. |
| 5 | Nu na nu nống | Có bản phổ biến trong nguồn. |
| 6 | Lộn cầu vồng | Import bản 1; bản 2 giữ ở snapshot. Đây là giả định chọn dị bản đã ghi chú. |
| 7 | Cái ngủ mày ngủ cho lâu | Có. |
| 8 | Gánh gánh gồng gồng | Có. |
| 9 | Con công hay múa | Có. |
| 10 | Rềnh rềnh ràng ràng | Có. |
| 11 | Con cua mà có hai càng | Có. |
| 12 | Lúa ngô là cô đậu nành | Có. |
| 13 | Kéo cưa lừa xẻ | Import dị bản đầu, không ghép hai bản. |
| 14 | Chi chi chành chành | Có. |
| 15 | Ông sảo ông sao | Có. |
| 16 | Ông giẳng ông giăng | Có. |
| 17 | Chú Cuội ngồi gốc cây đa | Có. |
| 18 | Bà còng đi chợ trời mưa | Có. |
| 19 | Cái bống là cái bống bang | Có. |
| 20 | Thằng Bờm có cái quạt mo | Có. |
| 21 | Nhạc rừng | Giữ nhãn Thanh Lan/Thơ theo khách; chưa xác minh độc lập tác giả/thể loại/quyền. |

“Có” trong bảng là lời nguồn được ánh xạ, không phải audio/bản dịch đã duyệt hoặc đang live. Dòng 22–28 của Docs để trống, không tính thành 7 truyện thiếu. Tất cả 21 tác phẩm còn cần duyệt audio, quyền sử dụng, ngôn ngữ và độ phù hợp tuổi.

### 5.7 Khám phá văn hóa

| Nhóm khách yêu cầu | Mẫu hiện tại |
| --- | --- |
| Ngày Tết | Tết Nguyên Đán |
| Món ăn Việt | Bánh chưng |
| Trang phục | Áo dài |
| Phong tục | Nội dung phong tục |
| Lễ hội | Nội dung lễ hội/Trung thu |
| Đồ vật & biểu tượng | Nón lá |
| Thiên nhiên Việt Nam | Nội dung thiên nhiên |
| Trò chơi dân gian | Nội dung trò chơi dân gian |

Đủ 8 nhóm nền tảng, card và trang chi tiết. Bootstrap có intro + 3 facts + 1 quiz cho mỗi mẫu. Tuy nhiên nhiều nội dung là phần biên soạn bổ sung, không phải toàn văn khách đã duyệt. Danh sách ví dụ trong Docs như phở/bánh mì/kéo co không tự đồng nghĩa mỗi ví dụ phải là một bài độc lập.

Có cơ chế đọc/nghe và bản dịch cạnh tiếng Việt nếu đã nhập. Chưa đủ audio/bản dịch duyệt; ảnh khách yêu cầu dịch cả intro/facts nên không thể đóng chỉ bằng việc đổi ngôn ngữ menu. Câu quiz Bánh chưng–Tết có ánh xạ; câu thứ hai trong nguồn thiếu đầy đủ lựa chọn, cần biên tập.

### 5.8 Tiến độ học tập

| Yêu cầu | Trạng thái |
| --- | --- |
| Tên bé/chặng hiện tại/số bài/tổng quan | Có. |
| Tiến độ 5 chặng và trạng thái khóa | Có. |
| Xem chi tiết/tiếp tục trên từng chặng | Thiếu link ở card chặng. |
| Điểm học tập riêng với số dư ViVi | Thiếu; công thức chuyển đổi chưa được khách xác định. |
| Từ vựng đã học | Chưa có tổng hợp theo yêu cầu tab Cấu trúc. |
| Hoạt động gần đây | Có; log khám phá truyện không chứng minh đã nghe hết. |
| Bốn nhóm năng lực theo % nội dung | Có UI, nhưng công thức proxy cố định theo 4 bài/trọng số, không theo tổng nội dung của từng kỹ năng. |
| Đếm riêng truyện/văn hóa/bài học | Có; cần đặt tên trung thực “đã khám phá”, không tự coi là nghe hoàn tất. |
| Liên kết Điểm thưởng | Có. |

Các số 6/10, 4/20 trong Docs là ví dụ trình bày, không dùng làm tổng số bắt buộc của catalog.

### 5.9 Điểm thưởng và vật phẩm

| Yêu cầu | Trạng thái |
| --- | --- |
| Số dư hiện có | Có. |
| Lịch sử thời gian/hành động/số cộng trừ | Có, phân trang. |
| Thưởng lesson/activity/stage và quy tắc admin | Có hệ thống cấu hình giới hạn 5 rule; award activity tại final submit thành công theo quyết định nội bộ. Không có đầy đủ loại thử thách tùy ý. |
| Đổi vật phẩm theo tên/mô tả/giá | Có, vẫn còn lỗi đổi ảo đồng thời F05. |
| Avatar/trang trí/vật phẩm sở hữu | Có nền tảng sở hữu/trang bị. |
| “Sử dụng phần thưởng” cũng trừ điểm | Khác quyết định nội bộ: trang bị avatar/frame đã sở hữu miễn phí, không có consumable debit riêng. Cần xác nhận scope với khách. |
| Huy hiệu theo thành tích | Sai điều kiện hiện tại, xem F07; không dùng số dư có thể tiêu để thay thành tích lâu dài. |

### 5.10 Footer

Có trên public layout, brand, liên hệ, email và điện thoại đúng. Còn thiếu đường dẫn khóa học/lộ trình và Facebook theo Docs. Điều khoản/bảo mật hiện là nhãn “chưa có”, không phải trang pháp lý đã hoàn thiện. Không invent URL Facebook hoặc tự viết cam kết pháp lý thay owner.

## 6. Các lỗi đã note trong docs nội bộ: đã sửa hay chưa?

### Đã có bằng chứng sửa trong code hiện tại

| Nhóm ghi chú cũ | Kết luận hiện tại |
| --- | --- |
| Modal admin thiếu focus/Tab/Escape | Đã chuyển sang Modal chung có focus trap/restore/Escape. Ghi chú “chưa sửa” cũ đã lỗi thời. |
| Mobile VI/EN mất nút | Đã sửa và có test. |
| CMS dịch lệch khi thêm/xóa/đổi thứ tự dòng | Đã sửa prospectively cho mọi ngôn ngữ, cả dòng trùng; không tự sửa dữ liệu đã lệch trước đây. |
| Word card/thẻ xếp tràn chữ | Renderer đã gia cố, có test/journal UI; chưa thay cho nghiệm thu mọi thiết bị. |
| Không chuyển bài kế/cache map khóa cũ | Đã nối navigation và invalidate stages ở submit online. |
| CORS/origin/cookie production | Đã có allowlist/HTTPS và test lỗi origin. Không khẳng định đã xử lý session/log bị lộ lịch sử. |
| Parent Gate chỉ bảo vệ ở client | Server routes có gate middleware; purpose token không dùng được như access token. |
| Lesson progress/ledger/balance không atomic | Đã dùng transaction và khóa Child, có rollback/concurrency tests. Không sửa ngược dữ liệu lịch sử. |
| Ownership/unlock/content snapshot | Có enforcement GET/complete, replay bài đã hoàn thành; vẫn còn paid policy thiếu field. |
| Thu âm giả boolean | Đã yêu cầu receipt gắn đúng child/lesson/version/activity. |
| Quota bé/screen-time bypass | Có khóa transaction khi tạo bé và loại screenTime khỏi update thường. |
| Xóa bé/cascade DB | Có transaction; audio ngoài DB còn eventual cleanup/race nêu trên. |
| Quiz/exploration idempotency | Có unique index và kiểm tra đáp án; cần bảo đảm index thật đã apply. |
| Admin payload/RBAC/CMS | Có auth admin, draft/CAS/publish transaction; legacy live write bị chặn; publish mặc định tắt. |
| Refund/tồn kho | Có resource lock và compensation tests. Lỗi compensation/crash còn cần đối soát. |
| Google login placeholder | Đã có flow server thật, nonce/email_verified/TTL/index gate/transaction. |
| PayOS callback/webhook | Gắn orderCode, verify signature/amount, transaction; unknown signed order ACK có log, không cấp gói cho test order. |
| Search/list không giới hạn | Có escape/clamp/limit/pagination tương ứng từng endpoint. |
| Secrets mẫu/default production | Có validate môi trường, từ chối JWT mẫu; không chứng minh secret vận hành đã đúng/đã rotate. |
| Hiệu năng query/index/frontend | Có aggregate/bounded reads, production autoIndex false, route lazy chunks; một số mô tả F5 cũ không còn đúng. |

### Còn mở hoặc chỉ sửa một phần

| Nhóm | Việc còn lại |
| --- | --- |
| Grading “khắc phục hoàn toàn” | F06 vẫn cho legacy fallback; cần fail closed hoặc migrate canonical answer đã duyệt. |
| Đổi thưởng “hết race” | F05 vẫn trừ trùng vật phẩm ảo đồng thời. |
| Paid plan strict active/expiry | F11 vẫn chấp nhận thiếu field. |
| Admin điểm/sao/trạng thái | F08 chưa sửa. |
| Error state | F12; screen-time PATCH cũng chưa có catch/error UI (`ParentSettingsPage.tsx:65`). |
| Parent PIN | Mặc định 1234; chưa có flow đặt/đổi/reset PIN. Server gate có thật nhưng PIN không thành bí mật riêng. |
| Email/Google linking | Chưa verify email đăng ký, còn pre-account risk; cần chính sách xác minh/khôi phục. |
| Offline sync | Worker có, ACK queue có; sau sync chưa invalidate points/stages hoặc cập nhật balance; event `vietverse_offline_synced` không thấy subscriber. |
| Refresh token rotation | Đọc/check rồi save revoked không atomic; có thể hai request đồng thời cùng mint replacement. Đây là rủi ro code tĩnh, chưa tái hiện với DB. |
| Thu âm finalize/cleanup | F04 và mục 4; test qua không đủ đóng lỗi concurrency chập chờn. |
| Trạng thái vận hành | Current deploy, indexes, backup/restore/offsite, rollback, networking/least privilege, credential rotation chưa được nghiệm thu trong lần này. |
| Thanh toán vận hành | Cần kiểm chứng callback/webhook thật và đối soát pending/missing webhook; không thấy job đối soát tự động. |
| Học liệu/quyền/âm thanh/bản dịch | Chưa có bộ đầu vào được duyệt đầy đủ. |
| A11y/thiết bị/phụ thuộc | Có sửa code/journal trước, chưa chạy lại đầy đủ screen reader/axe/iOS/Android hoặc audit dependencies trong lượt này. |

`docs/06-review-findings.md` là lịch sử append nhiều đợt, không phải checklist “all green”: có mục “đã hết P0/P1” nhưng debt vẫn tồn tại, mục modal “chưa sửa” đã lỗi thời, giá cũ bị thay, và giới hạn query/cascade được sửa ở phần sau. Không đọc một đoạn kết luận cũ để đóng toàn bộ.

## 7. Các quyết định nghiệp vụ chưa được tự suy đoán

1. “AI evernote” chính xác là dịch vụ nào, giọng nào, ai chịu phí, ai duyệt/phát hành audio?
2. “k đặt đc câu hỏi” xảy ra màn nào, thao tác nào, tài khoản nào?
3. Dùng các bản dịch khách đã cung cấp trong Docs mới; xin bổ sung/duyệt phần chưa có, nhất là story/culture. Chốt hiển thị một hay nhiều ngôn ngữ khi bé chọn nhiều và locale cụ thể của “khác”.
4. Điểm học tập tách ViVi thế nào; tỷ lệ chuyển đổi; thời điểm cộng; thử thách; sử dụng thưởng có tiêu điểm không.
5. B20 cần đúng/hoàn thành đủ 5 thử thách hay giữ gate chung >=50%; điều kiện huy hiệu/certificate.
6. Taxonomy truyện khác nhau giữa tab cấu trúc và chi tiết; dị bản Lộn cầu vồng/Kéo cưa, attribution Nhạc rừng.
7. Duyệt nội dung biên soạn bổ sung, quyền học liệu/audio/ảnh, nội dung pháp lý, Facebook chính thức.
8. Quyền riêng tư/retention bản thu trẻ em và setup/reset PIN.

Đây là các lựa chọn ảnh hưởng nghiệp vụ hoặc chi phí, không phải lý do bỏ qua những bug code đã xác nhận.

## 8. Kiểm chứng và giới hạn

- Đã chạy lại trực tiếp tại `35c51ca`: `npm test` qua server **497/497** (51 file, 162,22 giây), client **304/304** (35 file, 14,29 giây), exit 0.
- `npm run typecheck` và `npm run build` server + client đều exit 0. Build Vite 1.832 modules. Không suy ra “đủ yêu cầu khách” từ việc test/build qua.
- Test backend dùng MongoMemoryReplSet tạm; không thay DB production. Test audio dùng mock không xác nhận chất giọng hoặc âm thanh thật.
- Bộ audio focused 59/59 thuộc các suite trên, không cộng thành test độc lập mới.
- Cảnh báo React `act()` ở audioPlayback là cảnh báo đã có.
- Probe grading/policy là hàm thuần; probe đổi vật phẩm dùng service thật với model giả, chưa phải concurrency test DB production.
- Chẩn đoán public trước đó: healthz HTTP200, status ok/production lúc 2026-10-18T14:19:12.150Z. Chỉ chứng minh tiến trình trả lời, không chứng minh revision, catalog, Cloudinary, Google hay PayOS.
- Không đăng nhập production, tạo bé, thu/upload thật, thanh toán, mua AI, publish CMS hoặc migrate dữ liệu trong review.
- Không có thay đổi code sản phẩm. Báo cáo này là kết quả rà soát, không phải biên bản nghiệm thu đã sửa hết.

## 9. Thứ tự thực hiện đề xuất

| Bước | Hạng mục | Điều kiện hoàn tất |
| --- | --- | --- |
| 1 | Chốt baseline release + đối chiếu dữ liệu live read-only | Xác định commit triển khai, catalog/version, cấu hình readiness không lộ secret. |
| 2 | Sửa integrity: grading, đổi ảo, finalize, paid policy | Test hồi quy fail trước/pass sau; kiểm thử đồng thời và không thưởng/trừ trùng. |
| 3 | Xử lý audio/thu âm | Chốt provider/audio; kiểm tra storage; thêm nghe mẫu và error/retry; nghiệm thu desktop/iOS/Android lưu rồi nghe lại từ phụ huynh. |
| 4 | Sửa quy tắc player/song ngữ | Sai phải retry cùng câu; hint theo support language; đúng khen tiếng Việt; reset hint; không mất reset thẻ. |
| 5 | Hoàn thiện curriculum theo thứ tự B1 → B20 | Checklist từng hoạt động, lời/audio/bản dịch/đáp án được duyệt; không thay tương tác nghe/nói bằng câu chữ để đủ số bài. |
| 6 | Hoàn thiện 21 truyện + 8 nhóm văn hóa | Duyệt nguồn/quyền/audio/bản dịch, nhóm loại, related links nếu chốt; test với catalog thực. |
| 7 | Tiến độ/ViVi/huy hiệu | Chốt công thức; từ vựng; link chặng; điều kiện huy hiệu đúng thành tích, không phụ thuộc số dư tiêu được. |
| 8 | Header/CTA/footer/admin/error states | Sửa điều hướng, giá trị 0, legal/contact đã duyệt; keyboard/mobile/retry. |
| 9 | Auth/privacy/offline/vận hành | PIN/email/rotation, late upload cleanup, cache sau sync, indexes/backup/payment reconciliation. |
| 10 | Nghiệm thu cuối theo 10 tab + 11 lỗi | Mỗi mục có bước tái hiện, bằng chứng sau sửa, phiên bản/thiết bị; chỉ đóng production sau kiểm tra release thật. |

Không có bước nào trong bảng này đã được tự triển khai bởi lượt review.
