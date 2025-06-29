import { Link } from "react-router-dom";
import { BookOpen, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold">EnglishClass</span>
            </div>
            <p className="text-gray-300 text-sm">
              แพลตฟอร์มเรียนภาษาอังกฤษออนไลน์ที่ทันสมัย สำหรับผู้เรียนและครูผู้สอนในประเทศไทย
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ลิงก์ด่วน</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-gray-300 hover:text-orange-500 transition-colors">
                หน้าหลัก
              </Link>
              <Link to="/courses" className="block text-gray-300 hover:text-orange-500 transition-colors">
                คอร์สเรียน
              </Link>
              <Link to="/pricing" className="block text-gray-300 hover:text-orange-500 transition-colors">
                แพ็คเกจ
              </Link>
              <Link to="/login" className="block text-gray-300 hover:text-orange-500 transition-colors">
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ช่วยเหลือ</h3>
            <div className="space-y-2">
              <a href="#" className="block text-gray-300 hover:text-orange-500 transition-colors">
                คำถามที่พบบ่อย
              </a>
              <a href="#" className="block text-gray-300 hover:text-orange-500 transition-colors">
                ติดต่อเรา
              </a>
              <a href="#" className="block text-gray-300 hover:text-orange-500 transition-colors">
                นโยบายความเป็นส่วนตัว
              </a>
              <a href="#" className="block text-gray-300 hover:text-orange-500 transition-colors">
                เงื่อนไขการใช้งาน
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ติดต่อเรา</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="h-4 w-4" />
                <span className="text-sm">info@englishclass.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="h-4 w-4" />
                <span className="text-sm">02-123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">กรุงเทพมหานคร, ประเทศไทย</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-300 text-sm">
            © 2025 EnglishClass. สงวนลิขสิทธิ์ทุกประการ.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;