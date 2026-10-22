import { exploreCurriculum } from './exploreCurriculum.js';

/**
 * Illustration images for the Explore curriculum (Phase 04).
 *
 * Keys come in two shapes, both using the text normalized with {@link normalizeImageKey} (NFC + trim):
 *
 * - a **lesson-scoped** key `B<order>:<text>` — the image to use for that text in that lesson only, and
 * - a **shared** key `<text>` — the image for the text in every other lesson.
 *
 * {@link imageUrlFor} prefers the lesson-scoped key, so the same word can carry a different picture per
 * lesson: `bà` is a grandmother in B1/B13/B20 but a tone-practice syllable card in B7, and `ba`/`bá`/…
 * are people vs. tone cards likewise. The images live on Cloudinary under `vietverse/lesson-images/explore/`;
 * their sources and licences are listed in `docs/explore-image-credits.md`, and {@link buildExploreLessonPayload} reads it
 * when building the payload. A text that is in neither key keeps an empty `imageUrl`.
 */
export const exploreCurriculumImages: Record<string, string> = {
  "A": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573718/vietverse/lesson-images/explore/letter-a-upper.webp",
  "B": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573720/vietverse/lesson-images/explore/letter-b-upper.webp",
  "B7:bà": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573756/vietverse/lesson-images/explore/tone-ba-huyen.webp",
  "Bé": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573691/vietverse/lesson-images/explore/child.webp",
  "Bé thức dậy": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573768/vietverse/lesson-images/explore/wake-up.webp",
  "Bé ăn sáng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573702/vietverse/lesson-images/explore/eat-breakfast.webp",
  "Bé đang chơi.": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573733/vietverse/lesson-images/explore/play.webp",
  "Bé đang đọc sách.": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573736/vietverse/lesson-images/explore/read-book.webp",
  "Bé đi học": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573708/vietverse/lesson-images/explore/go-to-school.webp",
  "Bên cửa hàng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573745/vietverse/lesson-images/explore/shop.webp",
  "Bạn": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573706/vietverse/lesson-images/explore/friend.webp",
  "Bố": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573695/vietverse/lesson-images/explore/dad.webp",
  "Bố đang ngủ.": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573694/vietverse/lesson-images/explore/dad-sleeping.webp",
  "C": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573722/vietverse/lesson-images/explore/letter-c-upper.webp",
  "Chó": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573699/vietverse/lesson-images/explore/dog.webp",
  "Cá": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573704/vietverse/lesson-images/explore/fish.webp",
  "Có": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573771/vietverse/lesson-images/explore/yesno-co.webp",
  "Dưới ao": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573734/vietverse/lesson-images/explore/pond.webp",
  "Không": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573772/vietverse/lesson-images/explore/yesno-khong.webp",
  "Lan": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573713/vietverse/lesson-images/explore/lan-girl.webp",
  "Lang Liêu": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573716/vietverse/lesson-images/explore/lang-lieu.webp",
  "Lang Liêu bỏ đi": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573714/vietverse/lesson-images/explore/lang-lieu-leaving.webp",
  "Lang Liêu được truyền ngôi": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573715/vietverse/lesson-images/explore/lang-lieu-throne.webp",
  "M": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573725/vietverse/lesson-images/explore/letter-m-upper.webp",
  "Mèo": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573688/vietverse/lesson-images/explore/cat.webp",
  "Mẹ": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573729/vietverse/lesson-images/explore/mom.webp",
  "Mẹ đang nấu cơm.": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573692/vietverse/lesson-images/explore/cook-rice.webp",
  "Nhà vua tức giận": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573711/vietverse/lesson-images/explore/king-angry.webp",
  "Nước Văn Lang": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573764/vietverse/lesson-images/explore/van-lang.webp",
  "Sơn Tinh": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573748/vietverse/lesson-images/explore/son-tinh.webp",
  "Thánh Gióng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573754/vietverse/lesson-images/explore/thanh-giong.webp",
  "Trong rừng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573705/vietverse/lesson-images/explore/forest.webp",
  "Trên biển": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573744/vietverse/lesson-images/explore/sea.webp",
  "Trên cây": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573764/vietverse/lesson-images/explore/tree.webp",
  "Vua Hùng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573767/vietverse/lesson-images/explore/vua-hung.webp",
  "Vua ra điều kiện truyền ngôi": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573712/vietverse/lesson-images/explore/king-condition.webp",
  "Vị thần": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573766/vietverse/lesson-images/explore/vi-than.webp",
  "a": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573718/vietverse/lesson-images/explore/letter-a-lower.webp",
  "anh": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573684/vietverse/lesson-images/explore/brother.webp",
  "b": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573719/vietverse/lesson-images/explore/letter-b-lower.webp",
  "ba": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573758/vietverse/lesson-images/explore/tone-ba-ngang.webp",
  "bà": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573835/vietverse/lesson-images/explore/grandma.webp",
  "bàn": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573752/vietverse/lesson-images/explore/table.webp",
  "bá": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573759/vietverse/lesson-images/explore/tone-ba-sac.webp",
  "bánh chưng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573680/vietverse/lesson-images/explore/banh-chung.webp",
  "bánh giầy": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573681/vietverse/lesson-images/explore/banh-giay.webp",
  "bã": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573758/vietverse/lesson-images/explore/tone-ba-nga.webp",
  "bé": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573691/vietverse/lesson-images/explore/child.webp",
  "bóng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573679/vietverse/lesson-images/explore/ball.webp",
  "bút": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573732/vietverse/lesson-images/explore/pen.webp",
  "bạ": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573757/vietverse/lesson-images/explore/tone-ba-nang.webp",
  "bạn": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573706/vietverse/lesson-images/explore/friend.webp",
  "bả": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573755/vietverse/lesson-images/explore/tone-ba-hoi.webp",
  "bố": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573695/vietverse/lesson-images/explore/dad.webp",
  "c": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573722/vietverse/lesson-images/explore/letter-c-lower.webp",
  "ca": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573730/vietverse/lesson-images/explore/mug.webp",
  "ch": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573696/vietverse/lesson-images/explore/digraph-ch.webp",
  "chim": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573682/vietverse/lesson-images/explore/bird.webp",
  "chó": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573699/vietverse/lesson-images/explore/dog.webp",
  "chơi": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573733/vietverse/lesson-images/explore/play.webp",
  "chạy": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573741/vietverse/lesson-images/explore/run.webp",
  "chị": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573746/vietverse/lesson-images/explore/sister.webp",
  "chợ": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573727/vietverse/lesson-images/explore/market.webp",
  "con cá": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573704/vietverse/lesson-images/explore/fish.webp",
  "cá": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573704/vietverse/lesson-images/explore/fish.webp",
  "cái bàn": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573752/vietverse/lesson-images/explore/table.webp",
  "cơm": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573740/vietverse/lesson-images/explore/rice-bowl.webp",
  "cặp": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573743/vietverse/lesson-images/explore/schoolbag.webp",
  "cửa hàng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573745/vietverse/lesson-images/explore/shop.webp",
  "e": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573723/vietverse/lesson-images/explore/letter-e.webp",
  "em": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573773/vietverse/lesson-images/explore/younger-sibling.webp",
  "ghế": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573689/vietverse/lesson-images/explore/chair.webp",
  "gió": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573770/vietverse/lesson-images/explore/wind.webp",
  "gà": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573690/vietverse/lesson-images/explore/chicken.webp",
  "gâu gâu": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573698/vietverse/lesson-images/explore/dog-sound.webp",
  "huyền": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573760/vietverse/lesson-images/explore/tonename-huyen.webp",
  "lan": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573732/vietverse/lesson-images/explore/orchid.webp",
  "m": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573724/vietverse/lesson-images/explore/letter-m-lower.webp",
  "me": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573753/vietverse/lesson-images/explore/tamarind.webp",
  "meo meo": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573687/vietverse/lesson-images/explore/cat-sound.webp",
  "mèo": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573688/vietverse/lesson-images/explore/cat.webp",
  "mũ": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573710/vietverse/lesson-images/explore/hat.webp",
  "mưa": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573735/vietverse/lesson-images/explore/rain.webp",
  "mẹ": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573729/vietverse/lesson-images/explore/mom.webp",
  "mẹ bé": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573728/vietverse/lesson-images/explore/mom-and-child.webp",
  "mẹ của bé": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573728/vietverse/lesson-images/explore/mom-and-child.webp",
  "ngang": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573761/vietverse/lesson-images/explore/tonename-ngang.webp",
  "ngồi": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573747/vietverse/lesson-images/explore/sit.webp",
  "ngủ": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573747/vietverse/lesson-images/explore/sleep.webp",
  "nh": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573697/vietverse/lesson-images/explore/digraph-nh.webp",
  "nhà": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573710/vietverse/lesson-images/explore/house.webp",
  "nhớ": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573738/vietverse/lesson-images/explore/remember.webp",
  "nước": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573769/vietverse/lesson-images/explore/water-glass.webp",
  "nấu": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573693/vietverse/lesson-images/explore/cook.webp",
  "nấu cơm": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573692/vietverse/lesson-images/explore/cook-rice.webp",
  "nắng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573750/vietverse/lesson-images/explore/sun.webp",
  "nống": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573739/vietverse/lesson-images/explore/rhyme-nong.webp",
  "o": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573726/vietverse/lesson-images/explore/letter-o.webp",
  "phấn": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573689/vietverse/lesson-images/explore/chalk.webp",
  "sách": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573683/vietverse/lesson-images/explore/book.webp",
  "sắc": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573763/vietverse/lesson-images/explore/tonename-sac.webp",
  "thức dậy": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573768/vietverse/lesson-images/explore/wake-up.webp",
  "tr": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573697/vietverse/lesson-images/explore/digraph-tr.webp",
  "truyện": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573749/vietverse/lesson-images/explore/storybook.webp",
  "trâu": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573686/vietverse/lesson-images/explore/buffalo.webp",
  "uống": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573701/vietverse/lesson-images/explore/drink.webp",
  "uống nước": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573700/vietverse/lesson-images/explore/drink-water.webp",
  "vở": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573731/vietverse/lesson-images/explore/notebook.webp",
  "á": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573717/vietverse/lesson-images/explore/letter-a-acute.webp",
  "ò ó o": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573741/vietverse/lesson-images/explore/rooster-sound.webp",
  "ông": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573709/vietverse/lesson-images/explore/grandpa.webp",
  "ăn": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573703/vietverse/lesson-images/explore/eat.webp",
  "ăn sáng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573702/vietverse/lesson-images/explore/eat-breakfast.webp",
  "Đi bơi": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573751/vietverse/lesson-images/explore/swim.webp",
  "Đi chợ": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573707/vietverse/lesson-images/explore/go-to-market.webp",
  "Đi học": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573708/vietverse/lesson-images/explore/go-to-school.webp",
  "đi": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573768/vietverse/lesson-images/explore/walk.webp",
  "đi học": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573708/vietverse/lesson-images/explore/go-to-school.webp",
  "đánh răng": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573685/vietverse/lesson-images/explore/brush-teeth.webp",
  "đọc": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573737/vietverse/lesson-images/explore/read.webp",
  "đọc sách": "https://res.cloudinary.com/dh947pv3u/image/upload/v1792573736/vietverse/lesson-images/explore/read-book.webp",
};

/** Normalize an option/vocabulary text into the image-map key: NFC then trim. */
export function normalizeImageKey(text: string): string {
  return text.normalize('NFC').trim();
}

/** The lesson-scoped image-map key for a text within a given lesson order. */
export function lessonImageKey(text: string, lessonOrder: number): string {
  return `B${lessonOrder}:${normalizeImageKey(text)}`;
}

/**
 * The image URL for an option/vocabulary text, or '' when none is mapped yet. When `lessonOrder`
 * is given, a lesson-scoped entry (`B<order>:<text>`) wins over the shared `<text>` entry, so a word
 * that means something different in this lesson can show its own picture.
 */
export function imageUrlFor(text: string, lessonOrder?: number): string {
  const key = normalizeImageKey(text);
  if (lessonOrder !== undefined) {
    const scoped = exploreCurriculumImages[lessonImageKey(text, lessonOrder)];
    if (scoped !== undefined) return scoped;
  }
  return exploreCurriculumImages[key] ?? '';
}

/** Every unique image text paired with the gathered lessons it appears in (for the two functions below). */
function collectImageTexts(): Map<string, Set<number>> {
  const byText = new Map<string, Set<number>>();
  const add = (raw: string | undefined, order: number) => {
    const key = raw ? normalizeImageKey(raw) : '';
    if (!key) return;
    (byText.get(key) ?? byText.set(key, new Set<number>()).get(key)!).add(order);
  };
  for (const lesson of exploreCurriculum) {
    for (const word of lesson.vocabulary) add(word.word, lesson.order);
    for (const activity of lesson.activities) {
      for (const option of activity.options ?? []) add(option.text, lesson.order);
    }
  }
  return byText;
}

/**
 * Every unique option/vocabulary text in the Explore curriculum that can carry an image, normalized
 * and sorted. Phase 04 uses this list to know which illustrations to generate. Only lesson options
 * and vocabulary words get images (not `targetWord` display cards), matching the Phase 02 spec.
 */
export function listExploreImageTexts(): string[] {
  return [...collectImageTexts().keys()].sort((a, b) => a.localeCompare(b, 'vi'));
}

/**
 * The same texts, each paired with the sorted list of lesson orders it appears in. A text with more
 * than one lesson may mean different things per lesson (e.g. `bà` the grandmother vs. the tone card),
 * so Phase 04 can decide whether that text needs a lesson-scoped image (`B<order>:<text>` key).
 */
export function listExploreImageTextsByLesson(): { text: string; lessons: number[] }[] {
  return [...collectImageTexts().entries()]
    .map(([text, lessons]) => ({ text, lessons: [...lessons].sort((a, b) => a - b) }))
    .sort((a, b) => a.text.localeCompare(b.text, 'vi'));
}
