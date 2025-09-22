import React from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
  Facebook,
  Linkedin,
  Instagram,
  Twitter,
  X,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-red-600 text-white py-8">
      <style jsx>{`
        input::selection {
          background: Highlight;
          color: HighlightText;
        }
      `}</style>

      <div className="container mx-auto px-6">
        {/* Responsive grid: 1 col on mobile, 2 on sm, 4 on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          {/* Logo */}
          <div className="flex flex-col items-center md:items-start">
            <img
              src="/FootIcon.png"
              alt="Tourney24 Logo"
              className="h-60 w-auto object-contain"
            />
          </div>

          {/* Get in Touch */}
          <div className="space-y-6 text-center md:text-left">
            <h3 className="text-xl font-bold">Get in Touch</h3>
            <div className="space-y-3 text-sm text-white/90">
              <div className="flex items-start justify-center md:justify-start space-x-2">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-1" />
                <div>
                  <p>1st R-Block Rajajinagar,</p>
                  <p>Bengaluru 560010</p>
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2 py-2">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <p>support@tourney24.com</p>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <p>+91 8095263150</p>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm font-bold">Follow Us On Social Media</p>
          </div>

          {/* Newsletter */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-lg font-semibold">Get Updates On Your Email</h3>
            <div className="space-y-3">
              <Input
                placeholder="Enter Your Email"
                className="bg-red-600 text-white placeholder:text-white p-4"
              />
              <Button className="w-full bg-white text-red-600 hover:bg-gray-100 font-semibold">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-10 text-center text-sm text-white/80">
          © {new Date().getFullYear()} Tourney24. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
