import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from './layouts/PublicLayout.js';
import { KidsLayout } from './layouts/KidsLayout.js';
import { ParentLayout } from './layouts/ParentLayout.js';
import { AdminLayout } from './layouts/AdminLayout.js';

// Guard
import { ProtectedRoute } from '../components/ui/ProtectedRoute.js';
import { PageLoader } from '../components/ui/PageLoader.js';

// Pages
import { LandingPage } from '../features/public/LandingPage.js';
import { NotFoundPage } from '../features/public/NotFoundPage.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { RegisterPage } from '../features/auth/RegisterPage.js';

import { AdaptiveContentLayout } from './layouts/AdaptiveContentLayout.js';
import { ChildSessionGuard } from '../components/ChildSessionGuard.js';

// Route-level code splitting: layouts and entry pages (landing, login, register, 404) stay in the
// main bundle; every other page loads on the first visit to its route.
const PricingPage = lazy(() => import('../features/public/PricingPage.js').then((m) => ({ default: m.PricingPage })));
const StoriesPage = lazy(() => import('../features/stories/StoriesPage.js').then((m) => ({ default: m.StoriesPage })));
const CulturePage = lazy(() => import('../features/culture/CulturePage.js').then((m) => ({ default: m.CulturePage })));
const QuestMapPage = lazy(() => import('../features/quest-map/QuestMapPage.js').then((m) => ({ default: m.QuestMapPage })));
const OnboardingWizard = lazy(() => import('../features/onboarding/OnboardingWizard.js').then((m) => ({ default: m.OnboardingWizard })));
const LessonPlayerPage = lazy(() => import('../features/lesson-player/LessonPlayerPage.js').then((m) => ({ default: m.LessonPlayerPage })));
const StoryDetailPage = lazy(() => import('../features/stories/StoryDetailPage.js').then((m) => ({ default: m.StoryDetailPage })));
const CultureDetailPage = lazy(() => import('../features/culture/CultureDetailPage.js').then((m) => ({ default: m.CultureDetailPage })));
const PointsShopPage = lazy(() => import('../features/points/PointsShopPage.js').then((m) => ({ default: m.PointsShopPage })));
const TreasureRoomPage = lazy(() => import('../features/points/TreasureRoomPage.js').then((m) => ({ default: m.TreasureRoomPage })));
const ParentDashboardPage = lazy(() => import('../features/parent/ParentDashboardPage.js').then((m) => ({ default: m.ParentDashboardPage })));
const ParentRecordingsPage = lazy(() => import('../features/parent/ParentRecordingsPage.js').then((m) => ({ default: m.ParentRecordingsPage })));
const ParentSettingsPage = lazy(() => import('../features/parent/ParentSettingsPage.js').then((m) => ({ default: m.ParentSettingsPage })));
const PaymentResultPage = lazy(() => import('../features/parent/PaymentResultPage.js').then((m) => ({ default: m.PaymentResultPage })));
const PaymentTestPage = lazy(() => import('../features/parent/PaymentTestPage.js').then((m) => ({ default: m.PaymentTestPage })));
const AdminDashboardPage = lazy(() => import('../features/admin/AdminDashboardPage.js').then((m) => ({ default: m.AdminDashboardPage })));
const AdminRevenuePage = lazy(() => import('../features/admin/AdminRevenuePage.js').then((m) => ({ default: m.AdminRevenuePage })));
const AdminLessonsPage = lazy(() => import('../features/admin/AdminLessonsPage.js').then((m) => ({ default: m.AdminLessonsPage })));
const ContentEditorPage = lazy(() => import('../features/admin/content/ContentEditorPage.js').then((m) => ({ default: m.ContentEditorPage })));
const ContentListPage = lazy(() => import('../features/admin/content/ContentListPage.js').then((m) => ({ default: m.ContentListPage })));
const ContentPreviewPage = lazy(() => import('../features/admin/content/ContentPreviewPage.js').then((m) => ({ default: m.ContentPreviewPage })));
const ContentCreatePage = lazy(() => import('../features/admin/content/ContentCreatePage.js').then((m) => ({ default: m.ContentCreatePage })));
const AdminLearnersPage = lazy(() => import('../features/admin/AdminLearnersPage.js').then((m) => ({ default: m.AdminLearnersPage })));
const AdminRedemptionsPage = lazy(() => import('../features/admin/AdminRedemptionsPage.js').then((m) => ({ default: m.AdminRedemptionsPage })));
const AdminPointRulesPage = lazy(() => import('../features/admin/AdminPointRulesPage.js').then((m) => ({ default: m.AdminPointRulesPage })));

/** Wraps a lazily loaded page so its chunk download shows the shared loader. */
const withSuspense = (page: React.ReactNode) => <Suspense fallback={<PageLoader />}>{page}</Suspense>;

export const router = createBrowserRouter([
  // Public Landing & Pricing
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'gia', element: withSuspense(<PricingPage />) },
      { path: 'dang-nhap', element: <LoginPage /> },
      { path: 'dang-ky', element: <RegisterPage /> },
    ],
  },

  // Public Stories & Culture (Open to visitors and children alike without login barrier)
  {
    element: <AdaptiveContentLayout />,
    children: [
      { path: 'kho-truyen', element: withSuspense(<StoriesPage />) },
      { path: 'kho-truyen/:id', element: withSuspense(<StoryDetailPage />) },
      { path: 'van-hoa', element: withSuspense(<CulturePage />) },
      { path: 'van-hoa/:id', element: withSuspense(<CultureDetailPage />) },
    ],
  },

  // Onboarding Wizard (protected — must be logged in to add a child)
  {
    path: '/thanh-toan',
    element: (
      <ProtectedRoute>
        {withSuspense(<PaymentResultPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/thanh-toan-thu',
    element: (
      <ProtectedRoute>
        {withSuspense(<PaymentTestPage />)}
      </ProtectedRoute>
    ),
  },

  // Onboarding Wizard (protected — must be logged in to add a child)
  {
    path: '/bat-dau',
    element: (
      <ProtectedRoute>
        {withSuspense(<OnboardingWizard />)}
      </ProtectedRoute>
    ),
  },

  // Standalone Lesson Player (protected)
  {
    path: '/hoc/:lessonId',
    element: (
      <ProtectedRoute>
        <ChildSessionGuard>{withSuspense(<LessonPlayerPage />)}</ChildSessionGuard>
      </ProtectedRoute>
    ),
  },

  // Kids World (protected — requires login)
  {
    element: (
      <ProtectedRoute>
        <ChildSessionGuard><KidsLayout /></ChildSessionGuard>
      </ProtectedRoute>
    ),
    children: [
      { path: 'kham-pha', element: withSuspense(<QuestMapPage />) },
      { path: 'diem-thuong', element: withSuspense(<PointsShopPage />) },
      { path: 'phong-bau-vat', element: withSuspense(<TreasureRoomPage />) },
    ],
  },

  // Parent Portal (protected)
  {
    path: '/phu-huynh',
    element: (
      <ProtectedRoute>
        <ChildSessionGuard screenTime={false}><ParentLayout /></ChildSessionGuard>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/phu-huynh/tien-do" replace /> },
      { path: 'tien-do', element: withSuspense(<ParentDashboardPage />) },
      { path: 'ban-thu-am', element: withSuspense(<ParentRecordingsPage />) },
      { path: 'cai-dat', element: withSuspense(<ParentSettingsPage />) },
      { path: 'thanh-toan-thu', element: withSuspense(<PaymentTestPage />) },
    ],
  },

  // Admin Portal (protected)
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(<AdminDashboardPage />) },
      { path: 'doanh-thu', element: withSuspense(<AdminRevenuePage />) },
      { path: 'bai-hoc', element: withSuspense(<AdminLessonsPage />) },
      { path: 'bai-hoc/:id', element: withSuspense(<ContentEditorPage kind="lesson" />) },
      { path: 'bai-hoc/:id/xem-truoc', element: withSuspense(<ContentPreviewPage kind="lesson" />) },
      { path: 'truyen', element: withSuspense(<ContentListPage kind="story" />) },
      { path: 'truyen/moi', element: withSuspense(<ContentCreatePage kind="story" />) },
      { path: 'truyen/:id', element: withSuspense(<ContentEditorPage kind="story" />) },
      { path: 'truyen/:id/xem-truoc', element: withSuspense(<ContentPreviewPage kind="story" />) },
      { path: 'van-hoa', element: withSuspense(<ContentListPage kind="culture" />) },
      { path: 'van-hoa/moi', element: withSuspense(<ContentCreatePage kind="culture" />) },
      { path: 'van-hoa/:id', element: withSuspense(<ContentEditorPage kind="culture" />) },
      { path: 'van-hoa/:id/xem-truoc', element: withSuspense(<ContentPreviewPage kind="culture" />) },
      { path: 'hoc-vien', element: withSuspense(<AdminLearnersPage />) },
      { path: 'doi-qua', element: withSuspense(<AdminRedemptionsPage />) },
      { path: 'quy-tac-diem', element: withSuspense(<AdminPointRulesPage />) },
      { path: 'test-thanh-toan', element: withSuspense(<PaymentTestPage />) },
    ],
  },

  // 404 Fallback
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
