/**
 * Bộ icon duy nhất của Vietverse.
 *
 * - Mọi màn hình import icon từ file này, không import `lucide-react` trực tiếp
 *   (ESLint chặn bằng `no-restricted-imports`).
 * - Icon mặc định là trang trí (`aria-hidden`). Icon mang nghĩa riêng phải có
 *   `aria-label`; khi đó `aria-hidden` tự bỏ và icon có `role="img"`.
 * - Không dùng emoji làm icon: emoji hiển thị khác nhau giữa hệ điều hành
 *   (cờ quốc gia thành chữ cái trên Windows) và không đổi được màu/kích cỡ nét.
 * - Một khái niệm nghiệp vụ dùng đúng một icon: xem `DomainIcon` bên dưới.
 */
import { createElement, forwardRef } from 'react';
import {
  ArrowLeft as LArrowLeft,
  ArrowRight as LArrowRight,
  Award as LAward,
  BookOpen as LBookOpen,
  BookOpenText as LBookOpenText,
  BookX as LBookX,
  Cake as LCake,
  Calendar as LCalendar,
  ChartColumn as LChartColumn,
  Check as LCheck,
  CircleAlert as LCircleAlert,
  CircleCheck as LCircleCheck,
  CircleHelp as LCircleHelp,
  CircleX as LCircleX,
  Clock as LClock,
  CloudOff as LCloudOff,
  Coins as LCoins,
  Compass as LCompass,
  CreditCard as LCreditCard,
  Crown as LCrown,
  Drum as LDrum,
  Earth as LEarth,
  ExternalLink as LExternalLink,
  Eye as LEye,
  Feather as LFeather,
  Flower2 as LFlower2,
  Gamepad2 as LGamepad2,
  Gem as LGem,
  Gift as LGift,
  GraduationCap as LGraduationCap,
  Hand as LHand,
  Headphones as LHeadphones,
  Heart as LHeart,
  HeartHandshake as LHeartHandshake,
  History as LHistory,
  Key as LKey,
  Landmark as LLandmark,
  Languages as LLanguages,
  Layers as LLayers,
  LayoutDashboard as LLayoutDashboard,
  Lightbulb as LLightbulb,
  LoaderCircle as LLoaderCircle,
  Lock as LLock,
  LockKeyhole as LLockKeyhole,
  LockOpen as LLockOpen,
  LogIn as LLogIn,
  LogOut as LLogOut,
  Mail as LMail,
  Map as LMap,
  MapPin as LMapPin,
  Menu as LMenu,
  MessageSquareHeart as LMessageSquareHeart,
  Mic as LMic,
  Moon as LMoon,
  Music as LMusic,
  Package as LPackage,
  PartyPopper as LPartyPopper,
  Pause as LPause,
  Pencil as LPencil,
  Phone as LPhone,
  PiggyBank as LPiggyBank,
  Play as LPlay,
  Puzzle as LPuzzle,
  RefreshCw as LRefreshCw,
  Rocket as LRocket,
  RotateCcw as LRotateCcw,
  Scroll as LScroll,
  Search as LSearch,
  Settings as LSettings,
  Shield as LShield,
  ShieldCheck as LShieldCheck,
  Shirt as LShirt,
  ShoppingBag as LShoppingBag,
  SlidersHorizontal as LSlidersHorizontal,
  Smile as LSmile,
  SmilePlus as LSmilePlus,
  Sparkles as LSparkles,
  Sprout as LSprout,
  Square as LSquare,
  Star as LStar,
  Target as LTarget,
  Trees as LTrees,
  TrendingUp as LTrendingUp,
  TriangleAlert as LTriangleAlert,
  Truck as LTruck,
  UserRound as LUserRound,
  Users as LUsers,
  UtensilsCrossed as LUtensilsCrossed,
  Volume2 as LVolume2,
  Wallet as LWallet,
  WifiOff as LWifiOff,
  X as LX,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

export type { LucideIcon as AppIcon, LucideProps as AppIconProps };

function withDefaults(Base: LucideIcon, name: string): LucideIcon {
  const Icon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
    const labelled = Boolean(props['aria-label'] || props['aria-labelledby']);
    return createElement(Base, {
      'aria-hidden': labelled ? undefined : true,
      role: labelled ? 'img' : undefined,
      ...props,
      ref,
    });
  });
  Icon.displayName = name;
  return Icon as LucideIcon;
}

export const ArrowLeft = withDefaults(LArrowLeft, 'ArrowLeft');
export const ArrowRight = withDefaults(LArrowRight, 'ArrowRight');
export const Award = withDefaults(LAward, 'Award');
export const BookOpen = withDefaults(LBookOpen, 'BookOpen');
export const BookOpenText = withDefaults(LBookOpenText, 'BookOpenText');
export const BookX = withDefaults(LBookX, 'BookX');
export const Cake = withDefaults(LCake, 'Cake');
export const Calendar = withDefaults(LCalendar, 'Calendar');
export const ChartColumn = withDefaults(LChartColumn, 'ChartColumn');
export const Check = withDefaults(LCheck, 'Check');
export const CircleAlert = withDefaults(LCircleAlert, 'CircleAlert');
export const CircleCheck = withDefaults(LCircleCheck, 'CircleCheck');
export const CircleHelp = withDefaults(LCircleHelp, 'CircleHelp');
export const CircleX = withDefaults(LCircleX, 'CircleX');
export const Clock = withDefaults(LClock, 'Clock');
export const CloudOff = withDefaults(LCloudOff, 'CloudOff');
export const Coins = withDefaults(LCoins, 'Coins');
export const Compass = withDefaults(LCompass, 'Compass');
export const CreditCard = withDefaults(LCreditCard, 'CreditCard');
export const Crown = withDefaults(LCrown, 'Crown');
export const Drum = withDefaults(LDrum, 'Drum');
export const Earth = withDefaults(LEarth, 'Earth');
export const ExternalLink = withDefaults(LExternalLink, 'ExternalLink');
export const Eye = withDefaults(LEye, 'Eye');
export const Feather = withDefaults(LFeather, 'Feather');
export const Flower2 = withDefaults(LFlower2, 'Flower2');
export const Gamepad2 = withDefaults(LGamepad2, 'Gamepad2');
export const Gem = withDefaults(LGem, 'Gem');
export const Gift = withDefaults(LGift, 'Gift');
export const GraduationCap = withDefaults(LGraduationCap, 'GraduationCap');
export const Hand = withDefaults(LHand, 'Hand');
export const Headphones = withDefaults(LHeadphones, 'Headphones');
export const Heart = withDefaults(LHeart, 'Heart');
export const HeartHandshake = withDefaults(LHeartHandshake, 'HeartHandshake');
export const History = withDefaults(LHistory, 'History');
export const Key = withDefaults(LKey, 'Key');
export const Landmark = withDefaults(LLandmark, 'Landmark');
export const Languages = withDefaults(LLanguages, 'Languages');
export const Layers = withDefaults(LLayers, 'Layers');
export const LayoutDashboard = withDefaults(LLayoutDashboard, 'LayoutDashboard');
export const Lightbulb = withDefaults(LLightbulb, 'Lightbulb');
export const LoaderCircle = withDefaults(LLoaderCircle, 'LoaderCircle');
export const Lock = withDefaults(LLock, 'Lock');
export const LockKeyhole = withDefaults(LLockKeyhole, 'LockKeyhole');
export const LockOpen = withDefaults(LLockOpen, 'LockOpen');
export const LogIn = withDefaults(LLogIn, 'LogIn');
export const LogOut = withDefaults(LLogOut, 'LogOut');
export const Mail = withDefaults(LMail, 'Mail');
export const MapIcon = withDefaults(LMap, 'MapIcon');
export const MapPin = withDefaults(LMapPin, 'MapPin');
export const Menu = withDefaults(LMenu, 'Menu');
export const MessageSquareHeart = withDefaults(LMessageSquareHeart, 'MessageSquareHeart');
export const Mic = withDefaults(LMic, 'Mic');
export const Moon = withDefaults(LMoon, 'Moon');
export const Music = withDefaults(LMusic, 'Music');
export const Package = withDefaults(LPackage, 'Package');
export const PartyPopper = withDefaults(LPartyPopper, 'PartyPopper');
export const Pause = withDefaults(LPause, 'Pause');
export const Pencil = withDefaults(LPencil, 'Pencil');
export const Phone = withDefaults(LPhone, 'Phone');
export const PiggyBank = withDefaults(LPiggyBank, 'PiggyBank');
export const Play = withDefaults(LPlay, 'Play');
export const Puzzle = withDefaults(LPuzzle, 'Puzzle');
export const RefreshCw = withDefaults(LRefreshCw, 'RefreshCw');
export const Rocket = withDefaults(LRocket, 'Rocket');
export const RotateCcw = withDefaults(LRotateCcw, 'RotateCcw');
export const Scroll = withDefaults(LScroll, 'Scroll');
export const Search = withDefaults(LSearch, 'Search');
export const Settings = withDefaults(LSettings, 'Settings');
export const Shield = withDefaults(LShield, 'Shield');
export const ShieldCheck = withDefaults(LShieldCheck, 'ShieldCheck');
export const Shirt = withDefaults(LShirt, 'Shirt');
export const ShoppingBag = withDefaults(LShoppingBag, 'ShoppingBag');
export const SlidersHorizontal = withDefaults(LSlidersHorizontal, 'SlidersHorizontal');
export const Smile = withDefaults(LSmile, 'Smile');
export const SmilePlus = withDefaults(LSmilePlus, 'SmilePlus');
export const Sparkles = withDefaults(LSparkles, 'Sparkles');
export const Sprout = withDefaults(LSprout, 'Sprout');
export const Square = withDefaults(LSquare, 'Square');
export const Star = withDefaults(LStar, 'Star');
export const Target = withDefaults(LTarget, 'Target');
export const Trees = withDefaults(LTrees, 'Trees');
export const TrendingUp = withDefaults(LTrendingUp, 'TrendingUp');
export const TriangleAlert = withDefaults(LTriangleAlert, 'TriangleAlert');
export const Truck = withDefaults(LTruck, 'Truck');
export const UserRound = withDefaults(LUserRound, 'UserRound');
export const Users = withDefaults(LUsers, 'Users');
export const UtensilsCrossed = withDefaults(LUtensilsCrossed, 'UtensilsCrossed');
export const Volume2 = withDefaults(LVolume2, 'Volume2');
export const Wallet = withDefaults(LWallet, 'Wallet');
export const WifiOff = withDefaults(LWifiOff, 'WifiOff');
export const X = withDefaults(LX, 'X');

/**
 * Icon cho từng khái niệm nghiệp vụ. Menu, thẻ thống kê và tiêu đề trang dùng
 * cùng một icon cho cùng một khái niệm, để bé và phụ huynh nhận ra mục quen.
 */
export const DomainIcon = {
  questMap: MapIcon,
  lessons: GraduationCap,
  stories: BookOpenText,
  culture: Landmark,
  rewardsShop: Gift,
  treasure: Award,
  points: Sparkles,
  recordings: Mic,
  progress: ChartColumn,
  settings: Settings,
  dashboard: LayoutDashboard,
  learners: Users,
  revenue: Wallet,
  paymentTest: CreditCard,
  pointRules: SlidersHorizontal,
  parentArea: ShieldCheck,
  hint: Lightbulb,
  offline: CloudOff,
  warning: TriangleAlert,
} as const satisfies Record<string, LucideIcon>;
