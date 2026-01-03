import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Về chúng tôi</h3>
            <p className="text-sm text-gray-600">
              Sổ thu chi cá nhân giúp bạn quản lý thu chi cá nhân một cách hiệu quả và dễ dàng.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/transactions" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Giao dịch
                </Link>
              </li>
              <li>
                <Link href="/wallets" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Ví
                </Link>
              </li>
              <li>
                <Link href="/statistics" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Thống kê
                </Link>
              </li>
              <li>
                <Link href="/savings" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Tiết kiệm
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Hỗ trợ</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Trợ giúp
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Thông tin</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Tiền tệ: VND</li>
              <li>Múi giờ: GMT+7</li>
              <li>Địa điểm: Việt Nam</li>
              <li>Phiên bản: 1.0.0</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                &copy; {currentYear} Expense Manager. All rights reserved.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Developed by{' '}
                <a
                  href="https://phatnguyen.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Phat Nguyen
                </a>{' '}
                ❤️
              </p>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Facebook
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Twitter
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
