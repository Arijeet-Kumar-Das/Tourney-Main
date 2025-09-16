import React from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Facebook, Linkedin, Instagram, Twitter, MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-red-600 text-white py-4">

      <style jsx>{`
        input::selection {
          background: Highlight;
          color: HighlightText;
        }
      `}</style>
      {/* Footer Content */}
      <div className="container mx-auto px-6">
        {/* Equal 4 columns, aligned top */}
        <div className="grid md:grid-cols-4 gap-12 items-center">

          {/* Logo */}
          <div className="flex flex-col items-start">
            <img
              src="/FootIcon.png"
              alt="Tourney24 Logo"
              className="h-70 w-auto object-contain"
            />
          </div>

          {/* Get in Touch */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold">Get in Touch</h3>
            <div className="space-y-2 text-sm text-white/90">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-1" />
                <div>
                  <p>1st R-Block Rajajinagar,</p>
                  <p>Bengaluru 560010</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 py-4">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <p>support@tourney24.com</p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <p>+91 8095263150</p>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-white font-bold">Follow Us On Social Media</p>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Get Updates On Your Email</h3>
            <div className="space-y-3">
              <Input
                placeholder="Enter Your Email"
                className="bg-red-600 text-white placeholder:text-white p-6"
              />
              <Button className="w-full bg-white text-red-600 hover:bg-gray-100 font-semibold">
                Subscribe
              </Button>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
