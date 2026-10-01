import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Key,
  ShieldCheck,
  Star,
  BookOpen,
  Gamepad2,
  Scroll,
  Clock,
  BookX,
  SmilePlus,
  MessageSquareHeart,
  Lightbulb,
  ArrowRight,
  Headphones,
  HeartHandshake
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full">
      {/* PHẦN 1: MỞ ĐẦU (HERO SECTION) */}
      <section className="relative w-full overflow-hidden bg-surface py-12 lg:py-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-secondary-fixed/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Cột trái: Văn bản & Kêu gọi hành động */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-sm">
                <Sparkles className="w-4 h-4 text-secondary fill-secondary" />
                <span className="text-xs uppercase font-bold tracking-wide">
                  Không Gian Kỳ Diệu Cho Trẻ Em Toàn Cầu
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] text-primary tracking-tight font-extrabold leading-[1.15]">
                CÙNG CON MỞ KHO BÁU,<br />
                <span className="relative inline-block text-secondary mt-1">
                  TIẾNG VIỆT THÊM NHIỆM MÀU
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-secondary-container"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 300 12"
                  >
                    <path d="M2 9C75 3 225 3 298 9" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
                  </svg>
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-on-surface-variant max-w-xl leading-relaxed font-medium">
                Một hành trình vừa học vừa chơi, nơi trẻ khám phá tiếng Việt qua những câu chuyện, trò chơi dân gian và báu vật văn hóa Việt Nam rực rỡ.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/bat-dau')}
                  className="btn-3d-primary inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-base select-none shadow-lg cursor-pointer"
                >
                  <Key className="w-5 h-5" />
                  <span>BẮT ĐẦU KHÁM PHÁ</span>
                  <Sparkles className="w-5 h-5 text-accent" />
                </button>

                <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-surface-container-high text-on-surface-variant font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5 text-tertiary" />
                  <span>Hoàn toàn miễn phí trải nghiệm 7 ngày</span>
                </div>
              </div>

              {/* Huy hiệu uy tín / Bằng chứng xã hội */}
              <div className="pt-4 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary font-bold flex items-center justify-center text-xs ring-2 ring-surface">
                      An
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-xs ring-2 ring-surface">
                      Bình
                    </div>
                    <div className="w-9 h-9 rounded-full bg-tertiary-container text-on-tertiary font-bold flex items-center justify-center text-xs ring-2 ring-surface">
                      Chi
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant font-bold">
                    10.000+ Gia đình kiều bào tin tưởng
                  </span>
                </div>
                <div className="h-4 w-px bg-outline-variant/60 hidden sm:block" />
                <div className="flex items-center gap-1.5 text-secondary">
                  <Star className="w-4 h-4 fill-secondary" />
                  <span className="text-xs font-bold text-on-surface">4.9 / 5</span>
                  <span className="text-xs text-on-surface-variant">(Đánh giá phụ huynh)</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Minh họa linh vật Sao Lí Lắc */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary-fixed/40 via-primary-fixed/30 to-tertiary-fixed/30 rounded-3xl blur-2xl transform -rotate-2 scale-95" />
                
                <div className="relative bg-surface-container-lowest rounded-3xl p-3 shadow-xl shadow-secondary/10 border-2 border-outline-variant/30">
                  <div className="overflow-hidden rounded-2xl relative aspect-[16/10] lg:aspect-[4/3] w-full bg-amber-50">
                    <img
                      alt="Linh vật Sao Lí Lắc đội nón lá cầm cuốn thư nhiệm màu bay trên làng quê Việt Nam"
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1NU71V84VUv2s7B4P8vRso08qdIBhss093d9mshiQV421NF12DYwQ11gtSCL_EYULpCasWFbceI5_DZVo0mBRBAT6aFzfNS-wbUHIj4C19D9SDVYUi6EreoFmMk7vD1YxeORyvNPHDBvW7L88Mw4As5TBn8rVxx-iXxfSIYVy4aryZYKXibHklkF9Gl7UN4v040VDEoymXSWRZNEvrUdglb9ZkIfEMM3cNcGT0ht6wUhEZXIjmlze"
                    />

                    {/* Nhãn trang trí góc dưới */}
                    <div className="absolute bottom-3 left-3 right-3 bg-surface/90 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full bg-tertiary animate-pulse" />
                        <span className="text-xs text-on-surface font-bold">
                          Linh vật Sao Lí Lắc & Cuốn Thư Bí Ẩn
                        </span>
                      </div>
                      <Sparkles className="w-4 h-4 text-secondary-container fill-secondary-container" />
                    </div>
                  </div>
                </div>

                {/* Huy hiệu treo góc */}
                <div className="absolute -top-4 -right-4 bg-secondary-container text-on-secondary-container text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform rotate-6 animate-bounce">
                  <span>💎 Học mà vui!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHẦN 2: VIETVERSE LÀ GÌ? */}
      <section className="w-full py-16 lg:py-24 bg-surface-container-low relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed mb-4">
            <span className="material-symbols-outlined text-[16px] text-tertiary">explore</span>
            <span className="text-xs uppercase font-bold tracking-wide">KHÔNG GIAN HỌC DIỆU KỲ</span>
          </div>

          <h2 className="font-display text-3xl lg:text-4xl text-primary text-center font-extrabold mb-4">
            VIETVERSE LÀ GÌ?
          </h2>

          <p className="text-base lg:text-lg text-on-surface-variant text-center max-w-3xl leading-relaxed mb-16 font-medium">
            VietVerse là không gian học tiếng Việt dành cho trẻ em Việt Nam lớn lên trong môi trường đa ngôn ngữ. Thay vì chỉ học qua bài học, trẻ sẽ khám phá tiếng Việt thông qua một hành trình tương tác, nơi câu chuyện, trò chơi và hoạt động học tập được kết hợp hài hòa.
          </p>

          {/* Lưới 3 Thẻ Tính Năng Bo Góc 24px */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {/* Thẻ 1 */}
            <div
              onClick={() => navigate('/kho-truyen')}
              className="group bg-surface-container-lowest rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start relative overflow-hidden border border-outline-variant/30 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-primary">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="inline-block px-3 py-1 rounded-md bg-primary-fixed-dim/40 text-on-primary-fixed-variant text-xs font-bold mb-3">
                Kho tàng dân gian
              </div>
              <h3 className="font-display text-xl text-on-surface font-bold mb-3">
                Học qua truyện kể
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Trẻ hòa mình vào kho tàng cổ tích dân gian Việt Nam với giọng đọc truyền cảm, minh họa rực rỡ mở ra vầng trăng sáng và khúc đồng dao ngọt ngào.
              </p>
              <div className="mt-auto pt-4 flex items-center gap-2 text-primary font-bold text-sm">
                <span>Đọc thử truyện cổ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Thẻ 2 */}
            <div
              onClick={() => navigate('/kham-pha')}
              className="group bg-surface-container-lowest rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start relative overflow-hidden border border-outline-variant/30 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-secondary">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <div className="inline-block px-3 py-1 rounded-md bg-secondary-fixed-dim/40 text-on-secondary-fixed-variant text-xs font-bold mb-3">
                Tương tác đa giác quan
              </div>
              <h3 className="font-display text-xl text-on-surface font-bold mb-3">
                Trò chơi tương tác
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Vừa chơi vừa ghi nhớ từ vựng qua các trò chơi dân gian hấp dẫn: ô ăn quan, đố vui thông thái, chiếc nón lá ma thuật và vòng quay chữ cái diệu kỳ.
              </p>
              <div className="mt-auto pt-4 flex items-center gap-2 text-secondary font-bold text-sm">
                <span>Chơi thử trò đố chữ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Thẻ 3 */}
            <div
              onClick={() => navigate('/van-hoa')}
              className="group bg-surface-container-lowest rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start relative overflow-hidden border border-outline-variant/30 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-tertiary">
                <Scroll className="w-8 h-8" />
              </div>
              <div className="inline-block px-3 py-1 rounded-md bg-tertiary-fixed-dim/40 text-on-tertiary-fixed-variant text-xs font-bold mb-3">
                Cội nguồn văn hóa
              </div>
              <h3 className="font-display text-xl text-on-surface font-bold mb-3">
                Báu vật văn hóa
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Tìm hiểu nhịp sống lễ hội truyền thống, danh lam ba miền, hoa sen ngọc bích và nhịp trống đồng, đánh thức niềm tự hào cội nguồn quê hương trong con.
              </p>
              <div className="mt-auto pt-4 flex items-center gap-2 text-tertiary font-bold text-sm">
                <span>Mở rương báu vật</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHẦN 3: LÝ DO CHÚNG TÔI XUẤT HIỆN */}
      <section className="w-full py-16 lg:py-24 bg-surface relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed mb-4">
            <HeartHandshake className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase font-bold tracking-wide">THẤU HIỂU NỖI LÒNG CHA MẸ</span>
          </div>

          <h2 className="font-display text-3xl lg:text-4xl text-on-surface text-center font-extrabold mb-4">
            LÝ DO CHÚNG TÔI XUẤT HIỆN
          </h2>

          <p className="text-base lg:text-lg text-on-surface-variant text-center max-w-2xl leading-relaxed mb-16 font-medium">
            Với những đứa trẻ lớn lên giữa nhiều ngôn ngữ, tiếng Việt đôi khi không còn là ngôn ngữ được sử dụng thường xuyên nhất trong đời sống thường nhật.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
            <div className="bg-surface-container rounded-[24px] p-6 flex flex-col space-y-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg text-on-surface font-bold">Thiếu thời gian</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Phụ huynh bận rộn với công việc, khó duy trì việc dạy và trò chuyện tiếng Việt đều đặn mỗi ngày cùng con.
              </p>
            </div>

            <div className="bg-surface-container rounded-[24px] p-6 flex flex-col space-y-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-secondary">
                <BookX className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg text-on-surface font-bold">Nội dung chưa phù hợp</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Sách vở truyền thống quá nặng tính ngữ pháp, chưa được thiết kế riêng cho tư duy của trẻ học ngôn ngữ thứ hai.
              </p>
            </div>

            <div className="bg-surface-container rounded-[24px] p-6 flex flex-col space-y-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary-container">
                <SmilePlus className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg text-on-surface font-bold">Trẻ dễ mất hứng thú</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Việc học chỉ xoay quanh ghi nhớ và bài tập khô khan khiến con nhanh chóng chán nản và từ chối giao tiếp.
              </p>
            </div>

            <div className="bg-surface-container rounded-[24px] p-6 flex flex-col space-y-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-tertiary">
                <MessageSquareHeart className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg text-on-surface font-bold">Thiếu môi trường</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Trẻ cần được nghe, nhìn, tương tác và phản hồi trong các tình huống đời sống sinh động, thân quen và gần gũi.
              </p>
            </div>
          </div>

          {/* Hộp thông điệp kết nối nổi bật bo tròn */}
          <div className="w-full max-w-4xl bg-primary-fixed/50 rounded-[28px] p-8 lg:p-10 flex flex-col sm:flex-row items-center gap-6 shadow-sm border border-primary/20">
            <div className="w-16 h-16 rounded-full bg-primary text-on-primary shrink-0 flex items-center justify-center shadow-[0_4px_0_0_#910a04]">
              <Lightbulb className="w-8 h-8" />
            </div>
            <p className="font-display text-lg lg:text-xl text-on-primary-fixed font-bold text-center sm:text-left leading-relaxed">
              VietVerse ra đời để biến việc học tiếng Việt thành một hành trình kỳ thú mà trẻ luôn mong muốn tự mình khám phá mỗi ngày.
            </p>
          </div>
        </div>
      </section>

      {/* PHẦN 4: HÀNH TRÌNH GIỮ GÌN TIẾNG VIỆT (BẢN ĐỒ KHO BÁU 5 CHẶNG) */}
      <section className="w-full py-16 lg:py-24 bg-surface-container-low relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed mb-4">
            <span className="material-symbols-outlined text-[16px] text-secondary">map</span>
            <span className="text-xs uppercase font-bold tracking-wide">BẢN ĐỒ THÁM HIỂM</span>
          </div>

          <h2 className="font-display text-3xl lg:text-4xl text-primary text-center font-extrabold mb-3">
            HÀNH TRÌNH GIỮ GÌN TIẾNG VIỆT CÙNG VIETVERSE
          </h2>

          <p className="text-base text-on-surface-variant text-center max-w-2xl leading-relaxed mb-16 font-medium">
            Lộ trình bài bản 5 chặng được thiết kế theo bản đồ phiêu lưu thám hiểm, giúp con vững vàng từng bước từ làm quen đến thành thạo.
          </p>

          {/* Bản đồ 5 Chặng Nối Nhau */}
          <div className="w-full relative mb-14">
            <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-1 -translate-y-12 border-t-4 border-dashed border-secondary-container/60 z-0" />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
              {/* Chặng 1 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col items-center text-center shadow-md hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-primary text-on-primary font-extrabold flex items-center justify-center text-xl shadow-[0_4px_0_0_#910a04] mb-4">
                  1
                </div>
                <span className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Chặng Khởi Đầu</span>
                <h3 className="font-display text-lg text-on-surface font-bold mb-2">Làm quen</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Khám phá bảng chữ cái vui nhộn, làm quen thanh điệu tiếng Việt qua các câu đồng dao nhịp nhàng.
                </p>
              </div>

              {/* Chặng 2 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col items-center text-center shadow-md hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container font-extrabold flex items-center justify-center text-xl shadow-[0_4px_0_0_#684000] mb-4">
                  2
                </div>
                <span className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Chặng Nền Móng</span>
                <h3 className="font-display text-lg text-on-surface font-bold mb-2">Âm và chữ</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Nhận diện mặt chữ, phát âm chuẩn xác với sự dẫn đường của linh vật Sao Lí Lắc đáng yêu.
                </p>
              </div>

              {/* Chặng 3 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col items-center text-center shadow-md hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-tertiary text-on-tertiary font-extrabold flex items-center justify-center text-xl shadow-[0_4px_0_0_#005236] mb-4">
                  3
                </div>
                <span className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Chặng Mở Rộng</span>
                <h3 className="font-display text-lg text-on-surface font-bold mb-2">Ghép từ</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Xây dựng vốn từ vựng phong phú về gia đình, thiên nhiên bốn mùa, trường lớp và đời sống hằng ngày.
                </p>
              </div>

              {/* Chặng 4 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col items-center text-center shadow-md hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-secondary text-on-secondary font-extrabold flex items-center justify-center text-xl shadow-[0_4px_0_0_#653e00] mb-4">
                  4
                </div>
                <span className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Chặng Tự Tin</span>
                <h3 className="font-display text-lg text-on-surface font-bold mb-2">Kể chuyện</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Tự tin ghép câu hoàn chỉnh, diễn đạt suy nghĩ và tập kể lại những mẩu chuyện cổ tích dí dỏm.
                </p>
              </div>

              {/* Chặng 5 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col items-center text-center shadow-md hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container font-extrabold flex items-center justify-center text-xl shadow-[0_4px_0_0_#910a04] mb-4">
                  5
                </div>
                <span className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Đích Đến Tự Hào</span>
                <h3 className="font-display text-lg text-on-surface font-bold mb-2">Báu vật Nước Nam</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Thấu hiểu nét đẹp văn hóa, lịch sử nước nhà và luôn tự hào với dòng máu Việt Nam trong tim.
                </p>
              </div>
            </div>
          </div>

          {/* Nút Khám Phá Lớn Giữa Bản Đồ */}
          <button
            onClick={() => navigate('/kham-pha')}
            className="btn-3d-accent inline-flex items-center gap-3 px-10 py-5 rounded-full font-display text-xl font-bold select-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">lock_open</span>
            <span>KHÁM PHÁ BÁU VẬT NƯỚC NAM</span>
            <Sparkles className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* PHẦN 5: KÊU GỌI HÀNH ĐỘNG CUỐI TRANG (FINAL CTA) */}
      <section className="w-full py-16 lg:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="relative bg-primary text-on-primary rounded-[36px] p-8 md:p-16 overflow-hidden shadow-2xl">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-container/30 blur-2xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-secondary/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container mb-6 shadow-sm">
                <Sparkles className="w-4 h-4 text-secondary-container" />
                <span className="text-xs uppercase font-bold tracking-wide">Cùng Nhau Vun Đắp Tương Lai</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                BẮT ĐẦU HÀNH TRÌNH KHÁM PHÁ TIẾNG VIỆT NHIỆM MÀU
              </h2>

              <p className="text-base sm:text-lg text-on-primary/90 leading-relaxed mb-10 font-medium">
                Cùng VietVerse mở từng cánh cửa, khám phá từng câu chuyện và tìm kiếm những báu vật của tiếng Việt.
              </p>

              <button
                onClick={() => navigate('/bat-dau')}
                className="btn-3d-accent inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full font-display text-xl font-bold select-none cursor-pointer mb-14"
              >
                <Sparkles className="w-6 h-6" />
                <span>BẮT ĐẦU KHÁM PHÁ NGAY</span>
                <ArrowRight className="w-6 h-6" />
              </button>

              {/* Khu vực liên hệ hỗ trợ phụ huynh */}
              <div className="w-full pt-8 border-t border-on-primary/20 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-on-primary/90">
                <span className="font-bold text-on-primary flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-secondary-fixed" />
                  Hãy liên hệ với VietVerse:
                </span>
                <a className="hover:underline flex items-center gap-1.5 hover:text-secondary-fixed transition-colors" href="mailto:hotro@vietverse.edu.vn">
                  hotro@vietverse.edu.vn
                </a>
                <span className="hidden sm:inline opacity-40">•</span>
                <a className="hover:underline flex items-center gap-1.5 hover:text-secondary-fixed transition-colors" href="tel:19006868">
                  1900 6868
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
