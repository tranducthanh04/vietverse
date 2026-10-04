import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from './layouts/PublicLayout.js';
import { KidsLayout } from './layouts/KidsLayout.js';
import { ParentLayout } from './layouts/ParentLayout.js';
import { AdminLayout } from './layouts/AdminLayout.js';

// Guard
import { ProtectedRoute } from '../components/ui/ProtectedRoute.js';

// Pages
import { LandingPage } from '../features/public/LandingPage.js';
import { PricingPage } from '../features/public/PricingPage.js';
import { NotFoundPage } from '../features/public/NotFoundPage.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { RegisterPage } from '../features/auth/RegisterPage.js';
import { OnboardingWizard } from '../features/onboarding/OnboardingWizard.js';
import { QuestMapPage } from '../features/quest-map/QuestMapPage.js';
import { LessonPlayerPage } from '../features/lesson-player/LessonPlayerPage.js';
import { StoriesPage } from '../features/stories/StoriesPage.js';
import { StoryDetailPage } from '../features/stories/StoryDetailPage.js';
import { CulturePage } from '../features/culture/CulturePage.js';
import { CultureDetailPage } from '../features/culture/CultureDetailPage.js';
import { PointsShopPage } from '../features/points/PointsShopPage.js';
import { TreasureRoomPage } from '../features/points/TreasureRoomPage.js';
import { ParentDashboardPage } from '../features/parent/ParentDashboardPage.js';
import { ParentRecordingsPage } from '../features/parent/ParentRecordingsPage.js';
import { ParentSettingsPage } from '../features/parent/ParentSettingsPage.js';
import { PaymentResultPage } from '../features/parent/PaymentResultPage.js';
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage.js';
import { AdminLessonsPage } from '../features/admin/AdminLessonsPage.js';
import { AdminLearnersPage } from '../features/admin/AdminLearnersPage.js';
import { AdminRedemptionsPage } from '../features/admin/AdminRedemptionsPage.js';
import { AdminPaymentTestPage } from '../features/admin/AdminPaymentTestPage.js';

import { AdaptiveContentLayout } from './layouts/AdaptiveContentLayout.js';

export const router = createBrowserRouter([
  // Public Landing & Pricing
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'gia', element: <PricingPage /> },
      { path: 'dang-nhap', element: <LoginPage /> },
      { path: 'dang-ky', element: <RegisterPage /> },
    ],
  },

  // Public Stories & Culture (Open to visitors and children alike without login barrier)
  {
    element: <AdaptiveContentLayout />,
    children: [
      { path: 'kho-truyen', element: <StoriesPage /> },
      { path: 'kho-truyen/:id', element: <StoryDetailPage /> },
      { path: 'van-hoa', element: <CulturePage /> },
      { path: 'van-hoa/:id', element: <CultureDetailPage /> },
    ],
  },

  // Onboarding Wizard (protected — must be logged in to add a child)
  {
    path: '/thanh-toan',
    element: (
      <ProtectedRoute>
        <PaymentResultPage />
      </ProtectedRoute>
    ),
  },

  // Onboarding Wizard (protected — must be logged in to add a child)
  {
    path: '/bat-dau',
    element: (
      <ProtectedRoute>
        <OnboardingWizard />
      </ProtectedRoute>
    ),
  },

  // Standalone Lesson Player (protected)
  {
    path: '/hoc/:lessonId',
    element: (
      <ProtectedRoute>
        <LessonPlayerPage />
      </ProtectedRoute>
    ),
  },

  // Kids World (protected — requires login)
  {
    element: (
      <ProtectedRoute>
        <KidsLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'kham-pha', element: <QuestMapPage /> },
      { path: 'diem-thuong', element: <PointsShopPage /> },
      { path: 'phong-bau-vat', element: <TreasureRoomPage /> },
    ],
  },

  // Parent Portal (protected)
  {
    path: '/phu-huynh',
    element: (
      <ProtectedRoute>
        <ParentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/phu-huynh/tien-do" replace /> },
      { path: 'tien-do', element: <ParentDashboardPage /> },
      { path: 'ban-thu-am', element: <ParentRecordingsPage /> },
      { path: 'cai-dat', element: <ParentSettingsPage /> },
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
      { index: true, element: <AdminDashboardPage /> },
      { path: 'bai-hoc', element: <AdminLessonsPage /> },
      { path: 'hoc-vien', element: <AdminLearnersPage /> },
      { path: 'doi-qua', element: <AdminRedemptionsPage /> },
      { path: 'test-thanh-toan', element: <AdminPaymentTestPage /> },
    ],
  },

  // 404 Fallback
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
