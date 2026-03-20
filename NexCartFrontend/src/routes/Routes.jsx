import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import RegistrationPage from "../pages/auth/RegistrationPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

import CustomerHomePage from "../pages/customer/CustomerHomePage";
import CartPage from "../pages/customer/CartPage";
import OrderPage from "../pages/customer/OrderPage";
import ProfilePage from "../pages/customer/ProfilePage";
import ProductDetailsPage from "../pages/customer/ProductDetailsPage";
import WishlistPage from "../pages/customer/WishlistPage";
import AboutPage from "../pages/customer/AboutPage";
import CustomerServicePage from "../pages/customer/support/CustomerServicePage";
import TrackOrderPage from "../pages/customer/support/TrackOrderPage";
import ReturnsRefundsPage from "../pages/customer/support/ReturnsRefundsPage";
import HelpCenterPage from "../pages/customer/support/HelpCenterPage";
import ContactUsPage from "../pages/customer/support/ContactUsPage";
import NotFoundPage from "../pages/NotFoundPage";

import AdminLogin from "../pages/admin/AdminLogin";

import AdminLayout from "../admin/layout/AdminLayout";
import DashboardPage from "../admin/pages/DashboardPage";
import ProductsPage from "../admin/pages/ProductsPage";
import CategoriesPage from "../admin/pages/CategoriesPage";
import OrdersPage from "../admin/pages/OrdersPage";
import CustomersPage from "../admin/pages/CustomersPage";
import CouponsPage from "../admin/pages/CouponsPage";
import AnalyticsPage from "../admin/pages/AnalyticsPage";
import SupportPage from "../admin/pages/SupportPage";
import SettingsPage from "../admin/pages/SettingsPage";
import NotificationsPage from "../admin/pages/NotificationsPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/customerhome" element={<CustomerHomePage />} />
      <Route path="/home" element={<CustomerHomePage />} />
      <Route path="/products" element={<CustomerHomePage />} />
      <Route path="/UserCartPage" element={<CartPage />} />
      <Route path="/checkout" element={<CartPage />} />
      <Route path="/orders" element={<OrderPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/product/:productId" element={<ProductDetailsPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/about" element={<AboutPage />} />

      <Route path="/support/customer-service" element={<CustomerServicePage />} />
      <Route path="/support/track-order" element={<TrackOrderPage />} />
      <Route path="/support/returns-refunds" element={<ReturnsRefundsPage />} />
      <Route path="/support/help-center" element={<HelpCenterPage />} />
      <Route path="/support/contact-us" element={<ContactUsPage />} />

      <Route path="/admin" element={<AdminLogin />} />

      <Route path="/admindashboard" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
