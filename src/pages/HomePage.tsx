import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  Play, 
  CheckCircle,
  Globe,
  Award,
  MessageCircle
} from "lucide-react";

const HomePage = () => {
  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-orange-500" />,
      title: "คอร์สที่หลากหลาย",
      description: "เรียนภาษาอังกฤษตั้งแต่ระดับเริ่มต้นจนถึงขั้นสูง"
    },
    {
      icon: <Users className="h-8 w-8 text-orange-500" />,
      title: "เรียนแบบสด",
      description: "เรียนกับครูผู้เชี่ยวชาญแบบสดผ่านระบบออนไลน์"
    },
    {
      icon: <Clock className="h-8 w-8 text-orange-500" />,
      title: "เวลาที่ยืดหยุ่น",
      description: "เลือกเวลาเรียนที่เหมาะสมกับไลฟ์สไตล์ของคุณ"
    },
    {
      icon: <Award className="h-8 w-8 text-orange-500" />,
      title: "ใบประกาศนียบัตร",
      description: "รับใบประกาศนียบัตรเมื่อจบคอร์สเรียน"
    }
  ];

  const testimonials = [
    {
      name: "สมชาย ใจดี",
      role: "นักเรียน",
      content: "เรียนที่นี่ทำให้ผมพูดภาษาอังกฤษได้คล่องขึ้นมาก ครูสอนดีมาก",
      rating: 5
    },
    {
      name: "นางสาวมาลี สวยงาม",
      role: "นักเรียน",
      content: "ระบบเรียนออนไลน์ใช้งานง่าย เรียนได้ทุกที่ทุกเวลา",
      rating: 5
    },
    {
      name: "คุณสมศรี มีความสุข",
      role: "ครูผู้สอน",
      content: "แพลตฟอร์มนี้ช่วยให้การสอนเป็นเรื่องง่าย มีเครื่องมือครบครัน",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                  🎉 เปิดให้บริการแล้ว!
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  เรียนภาษาอังกฤษ
                  <span className="text-orange-500"> ออนไลน์</span>
                  <br />
                  กับครูมืออาชีพ
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  แพลตฟอร์มเรียนภาษาอังกฤษที่ทันสมัย เรียนแบบสดกับครูผู้เชี่ยวชาญ 
                  พร้อมระบบจัดการเรียนรู้ที่ครบครัน
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg">
                    เริ่มเรียนเลย
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                    <Play className="mr-2 h-5 w-5" />
                    ดูคอร์สเรียน
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>ทดลองเรียนฟรี</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>ครูมืออาชีพ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>ใบประกาศนียบัตร</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8">
                <img
                  src="https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg"
                  alt="Online English Learning"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">ความคืบหน้า</span>
                    <span className="text-sm font-medium text-orange-500">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>บทเรียนที่ 8 จาก 12</span>
                    <span>เหลือ 2 สัปดาห์</span>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-orange-500 text-white p-3 rounded-full shadow-lg">
                <Globe className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-3 rounded-full shadow-lg">
                <MessageCircle className="h-6 w-6" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              ทำไมต้องเลือกเรียนกับเรา?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              เรามีทุกสิ่งที่คุณต้องการสำหรับการเรียนภาษาอังกฤษที่มีประสิทธิภาพ
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-orange-500">1,000+</div>
              <div className="text-gray-600">นักเรียนที่ลงทะเบียน</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-orange-500">50+</div>
              <div className="text-gray-600">ครูผู้เชี่ยวชาญ</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-orange-500">95%</div>
              <div className="text-gray-600">ความพึงพอใจ</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-orange-500">24/7</div>
              <div className="text-gray-600">การสนับสนุน</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              ความคิดเห็นจากผู้ใช้งาน
            </h2>
            <p className="text-xl text-gray-600">
              ฟังเสียงจากผู้ที่เรียนและสอนกับเรา
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              พร้อมที่จะเริ่มต้นการเรียนรู้แล้วหรือยัง?
            </h2>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              เข้าร่วมกับนักเรียนหลายพันคนที่เรียนภาษาอังกฤษกับเรา
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-4 text-lg">
                  เริ่มเรียนฟรี
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-500 px-8 py-4 text-lg">
                  ดูแพ็คเกจ
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;