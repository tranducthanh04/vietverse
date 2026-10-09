# Đối soát nội dung khách hàng — 2026-10-09

Nguồn: ba snapshot và manifest trong thư mục này. Đây là dữ liệu nháp, không phải toàn bộ bài đã đủ điều kiện xuất bản. Mọi mục giữ nguồn/checksum và ghi chú biên tập trong CMS. Không chạy import production trong bước chuẩn bị.

Quyết định: không lấy nội dung demo làm lời khách hàng, không bịa audio/đáp án còn thiếu. Giả định: chọn dị bản đầu tiên ở hai bài có nhiều bản; ánh xạ thao tác được ghi theo từng mục dưới đây và cần admin duyệt.

## lesson-01: Bài 1. Người xung quanh em

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.

## lesson-02: Bài 2. Đồ vật quanh em

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (unsupported_activity): Chưa chuyển các thao tác kéo từ vào câu, thực hiện 3 bước, chọn nhiều chữ M, phân nhóm nhiều-về-một hoặc nhiều ô trống sang bài khác. Cần renderer phù hợp hoặc quyết định biên tập riêng.

## lesson-03: Bài 3. Con vật quanh em

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.

## lesson-04: Bài 4. Bé làm gì?

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (unsupported_activity): Chưa chuyển các thao tác kéo từ vào câu, thực hiện 3 bước, chọn nhiều chữ M, phân nhóm nhiều-về-một hoặc nhiều ô trống sang bài khác. Cần renderer phù hợp hoặc quyết định biên tập riêng.

## lesson-05: Bài 5. Khu chữ cái

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.
- activities (unsupported_activity): Chưa chuyển các thao tác kéo từ vào câu, thực hiện 3 bước, chọn nhiều chữ M, phân nhóm nhiều-về-một hoặc nhiều ô trống sang bài khác. Cần renderer phù hợp hoặc quyết định biên tập riêng.
- title (variant): Tên ở sơ đồ tổng quan khác heading giáo án chi tiết; nháp chọn heading chi tiết, không tự đổi live.

## lesson-06: Bài 6. Âm đầu

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.
- activities (unsupported_activity): Chưa chuyển các thao tác kéo từ vào câu, thực hiện 3 bước, chọn nhiều chữ M, phân nhóm nhiều-về-một hoặc nhiều ô trống sang bài khác. Cần renderer phù hợp hoặc quyết định biên tập riêng.

## lesson-07: Bài 7. Sáu thanh điệu

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.

## lesson-08: Bài 8. Đồng dao cùng Lí Lắc

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.

## lesson-09: Bài 9. Ghép chữ thành tiếng

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (normalization): Giả định ánh xạ: thẻ ghép có thứ tự dùng sort_order; câu nói mẫu dùng record_voice, không chấm phát âm bằng AI. Cần admin duyệt sự tương đương thao tác.

## lesson-10: Bài 10. Ghép tiếng thành từ

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (normalization): Giả định ánh xạ: thẻ ghép có thứ tự dùng sort_order; câu nói mẫu dùng record_voice, không chấm phát âm bằng AI. Cần admin duyệt sự tương đương thao tác.

## lesson-11: Bài 11. Chữ nào đang trốn?

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (unsupported_activity): Chưa chuyển các thao tác kéo từ vào câu, thực hiện 3 bước, chọn nhiều chữ M, phân nhóm nhiều-về-một hoặc nhiều ô trống sang bài khác. Cần renderer phù hợp hoặc quyết định biên tập riêng.

## lesson-12: Bài 12. Đọc cùng Lí Lắc

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.

## lesson-13: Bài 13. Ai đang làm gì?

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.
- activities (normalization): Giả định ánh xạ: thẻ ghép có thứ tự dùng sort_order; câu nói mẫu dùng record_voice, không chấm phát âm bằng AI. Cần admin duyệt sự tương đương thao tác.

## lesson-14: Bài 14. Kể chuyện theo thứ tự

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.
- title (variant): Tên ở sơ đồ tổng quan khác heading giáo án chi tiết; nháp chọn heading chi tiết, không tự đổi live.

## lesson-15: Bài 15. Nghe truyện

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.
- title (variant): Tên ở sơ đồ tổng quan khác heading giáo án chi tiết; nháp chọn heading chi tiết, không tự đổi live.

## lesson-16: Bài 16. Nói chuyện cùng Lí Lắc

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.
- title (variant): Tên ở sơ đồ tổng quan khác heading giáo án chi tiết; nháp chọn heading chi tiết, không tự đổi live.
- activities (normalization): Giả định ánh xạ: thẻ ghép có thứ tự dùng sort_order; câu nói mẫu dùng record_voice, không chấm phát âm bằng AI. Cần admin duyệt sự tương đương thao tác.

## lesson-17: Bài 17. Đọc và tìm thông tin

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.

## lesson-18: Bài 18. Đọc và hoàn thành câu

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.

## lesson-19: Bài 19. Câu đố dân gian

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.

## lesson-20: Bài 20. BÁU VẬT NƯỚC NAM

Trường ánh xạ: stageId, order, title, description, vocabulary, activities, freeInStarterPlan, totalActivities.

- audioUrl (missing_source): Nguồn mô tả lời audio, chưa có file thu âm. Không bịa URL hoặc thời lượng.
- description (normalization): Giữ toàn văn mục giáo án trong mô tả để đối chiếu. Payload tương tác chỉ ánh xạ phần nguồn có dữ liệu; chưa khẳng định hoàn chỉnh.
- vocabulary (missing_source): Các từ được trích từ nguồn; định nghĩa chưa được cung cấp đầy đủ, giữ trống để biên tập.
- activities (normalization): Biên soạn bổ sung chỉ ở nhãn thao tác, ID lựa chọn và chuẩn hóa ô trống thành __; không bổ sung đáp án nhiễu ngoài nguồn. Những câu chỉ có một đáp án chưa đủ điều kiện xuất bản.
- activities (missing_source): Một số yêu cầu còn mô tả chung, thiếu bộ câu hỏi/lựa chọn hoặc ngữ liệu hoàn chỉnh. Đối chiếu toàn văn giáo án trước xuất bản.

## story-01: 1. Trồng nụ trồng hoa

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-02: 2. Rồng rắn lên mây

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-03: 3. Hai bàn tay

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-04: 4. Dung dăng dung dẻ

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-05: 5. Nu na nu nống

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-06: 6. Lộn cầu vồng

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.
- lyrics (variant): Giả định chọn dị bản đầu tiên hiển thị; dị bản còn lại giữ nguyên trong snapshot nguồn, không ghép hai bản.

## story-07: 7. Cái ngủ mày ngủ cho lâu

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-08: 8. Gánh gánh gồng gồng

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-09: 9. Con công hay múa

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-10: 10. Rềnh rềnh ràng ràng

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-11: 11. Con cua mà có hai càng

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-12: 12. Lúa ngô là cô đậu nành

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-13: 13. Kéo cưa lừa xẻ

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.
- lyrics (variant): Giả định chọn dị bản đầu tiên hiển thị; dị bản còn lại giữ nguyên trong snapshot nguồn, không ghép hai bản.

## story-14: 14. Chi chi chành chành

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-15: 15. Ông sảo ông sao

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-16: 16. Ông giẳng ông giăng

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-17: 17. Chú Cuội ngồi gốc cây đa

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-18: 18. Bà còng đi chợ trời mưa

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-19: 19. Cái bống là cái bống bang

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-20: 20. Thằng Bờm có cái quạt mo

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.

## story-21: 21. Nhạc rừng – Thanh Lan

Trường ánh xạ: type, title, author, description, coverImage, lyrics, audioUrl, durationSec, ageGroups, vocab, quiz.

- audioUrl (missing_source): Chưa có file audio hoặc timestamp. Đây là bản đọc, không giả phát âm thanh.
- author (attribution): Nguồn khách hàng chưa phải xác nhận quyền sử dụng; cần xác minh trước phát hành.
- author (attribution): Giữ nhãn Nhạc rừng / Thanh Lan / Thơ đúng nguồn; tác giả và thể loại chưa được xác minh độc lập.

## culture-tet: TẾT NGUYÊN ĐÁN

Trường ánh xạ: category, title, intro, coverImage, funFacts, quiz, audioUrl, tags.

- intro (missing_source): Nguồn chỉ có nhóm/card ví dụ, chưa có toàn văn bài chi tiết.
- funFacts (missing_source): Chưa có 3–4 thông tin cụ thể trong nguồn; không dùng bài mẫu thay lời khách hàng.
- quiz (missing_source): Chưa có bộ câu hỏi và đáp án cho nhóm này.
- audioUrl (missing_source): Chưa có file audio.

## culture-am_thuc: BÁNH CHƯNG

Trường ánh xạ: category, title, intro, coverImage, funFacts, quiz, audioUrl, tags.

- intro (missing_source): Nguồn chỉ có nhóm/card ví dụ, chưa có toàn văn bài chi tiết.
- funFacts (missing_source): Chưa có 3–4 thông tin cụ thể trong nguồn; không dùng bài mẫu thay lời khách hàng.
- quiz (missing_source): Đã nhập câu có đủ lựa chọn/đáp án; câu thứ hai chỉ có đáp án Bánh chưng, chưa có lựa chọn.
- audioUrl (missing_source): Chưa có file audio.

## culture-trang_phuc: ÁO DÀI

Trường ánh xạ: category, title, intro, coverImage, funFacts, quiz, audioUrl, tags.

- intro (missing_source): Nguồn chỉ có nhóm/card ví dụ, chưa có toàn văn bài chi tiết.
- funFacts (missing_source): Chưa có 3–4 thông tin cụ thể trong nguồn; không dùng bài mẫu thay lời khách hàng.
- quiz (missing_source): Chưa có bộ câu hỏi và đáp án cho nhóm này.
- audioUrl (missing_source): Chưa có file audio.

## culture-phong_tuc: Phong tục

Trường ánh xạ: category, title, intro, coverImage, funFacts, quiz, audioUrl, tags.

- intro (missing_source): Nguồn chỉ có nhóm/card ví dụ, chưa có toàn văn bài chi tiết.
- funFacts (missing_source): Chưa có 3–4 thông tin cụ thể trong nguồn; không dùng bài mẫu thay lời khách hàng.
- quiz (missing_source): Chưa có bộ câu hỏi và đáp án cho nhóm này.
- audioUrl (missing_source): Chưa có file audio.

## culture-le_hoi: Lễ hội

Trường ánh xạ: category, title, intro, coverImage, funFacts, quiz, audioUrl, tags.

- intro (missing_source): Nguồn chỉ có nhóm/card ví dụ, chưa có toàn văn bài chi tiết.
- funFacts (missing_source): Chưa có 3–4 thông tin cụ thể trong nguồn; không dùng bài mẫu thay lời khách hàng.
- quiz (missing_source): Chưa có bộ câu hỏi và đáp án cho nhóm này.
- audioUrl (missing_source): Chưa có file audio.

## culture-vat_dung: NÓN LÁ

Trường ánh xạ: category, title, intro, coverImage, funFacts, quiz, audioUrl, tags.

- intro (missing_source): Nguồn chỉ có nhóm/card ví dụ, chưa có toàn văn bài chi tiết.
- funFacts (missing_source): Chưa có 3–4 thông tin cụ thể trong nguồn; không dùng bài mẫu thay lời khách hàng.
- quiz (missing_source): Chưa có bộ câu hỏi và đáp án cho nhóm này.
- audioUrl (missing_source): Chưa có file audio.

## culture-thien_nhien: Thiên nhiên Việt Nam

Trường ánh xạ: category, title, intro, coverImage, funFacts, quiz, audioUrl, tags.

- intro (missing_source): Nguồn chỉ có nhóm/card ví dụ, chưa có toàn văn bài chi tiết.
- funFacts (missing_source): Chưa có 3–4 thông tin cụ thể trong nguồn; không dùng bài mẫu thay lời khách hàng.
- quiz (missing_source): Chưa có bộ câu hỏi và đáp án cho nhóm này.
- audioUrl (missing_source): Chưa có file audio.

## culture-tro_choi_dan_gian: Trò chơi dân gian

Trường ánh xạ: category, title, intro, coverImage, funFacts, quiz, audioUrl, tags.

- intro (missing_source): Nguồn chỉ có nhóm/card ví dụ, chưa có toàn văn bài chi tiết.
- funFacts (missing_source): Chưa có 3–4 thông tin cụ thể trong nguồn; không dùng bài mẫu thay lời khách hàng.
- quiz (missing_source): Chưa có bộ câu hỏi và đáp án cho nhóm này.
- audioUrl (missing_source): Chưa có file audio.
