
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Webinar } from "@/types/webinar";

// Datos de ejemplo - En una versión real esto vendría de una API
const mockWebinars: Webinar[] = [
  {
    id: "1",
    title: "Introducción a React",
    description: "Aprende los fundamentos de React desde cero",
    startTime: new Date(Date.now() + 86400000),
    hostName: "Ana García",
    roomName: "react-intro"
  },
  {
    id: "2",
    title: "TypeScript Avanzado",
    description: "Mejora tus habilidades en TypeScript",
    startTime: new Date(Date.now() + 172800000),
    hostName: "Carlos Pérez",
    roomName: "ts-advanced"
  }
];

const WebinarList = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockWebinars.map((webinar, index) => (
        <motion.div
          key={webinar.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">
                {webinar.startTime.toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{webinar.title}</h3>
            <p className="text-gray-600 mb-4">{webinar.description}</p>
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">{webinar.hostName}</span>
            </div>
            <Button 
              onClick={() => navigate(`/webinar/${webinar.id}`)}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              Unirse al Webinar
            </Button>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default WebinarList;
