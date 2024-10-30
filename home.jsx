import React from 'react';
import { Button } from "./components/ui/button";
import { Calendar } from "lucide-react";
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Calendar className="h-12 w-12 text-blue-600" />
              <h1 className="text-6xl font-bold text-blue-600">SUBTRACK</h1>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-8">
              Keep Track of Your Subscriptions
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-500 sm:text-2xl">
              Manage all your subscriptions in one place. Track expenses, get insights, and never miss a payment.
            </p>
            <div className="mt-10">
              <Link to="/app">
                <Button size="lg" className="mx-2">Get Started</Button>
              </Link>
              <Button variant="outline" size="lg" className="mx-2">Learn More</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Track Everything</h3>
              <p className="text-gray-600">Monitor all your subscriptions in one place, both personal and business.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Smart Analytics</h3>
              <p className="text-gray-600">Get insights into your spending patterns with detailed reports and charts.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Never Miss a Payment</h3>
              <p className="text-gray-600">Track renewal dates and payment methods for all your subscriptions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              Ready to take control of your subscriptions?
            </h2>
            <Link to="/app">
              <Button size="lg" variant="secondary">
                Start Tracking Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;