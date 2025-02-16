
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Webinar } from "@/types/webinar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

const fetchWebinars = async (): Promise<Webinar[]> => {
  try {
    console.log('Fetching webinars...');
    const { data, error } = await supabase
      .from('webinars')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching webinars:', error);
      throw new Error(`Error al obtener webinars: ${error.message}`);
    }

    if (!data) {
      console.log('No webinars found');
      return [];
    }

    console.log('Webinars fetched successfully:', data);
    return data.map(webinar => ({
      id: webinar.id,
      title: webinar.title,
      description: webinar.description,
      startTime: new Date(webinar.start_time),
      hostName: webinar.host_name,
      roomName: webinar.room_name
    }));
  } catch (error) {
    console.error('Unexpected error fetching webinars:', error);
    throw error;
  }
};

const WebinarList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: webinars, isLoading, error } = useQuery({
    queryKey: ['webinars'],
    queryFn: fetchWebinars,
    retry: 2,
    meta: {
      onError: (error: Error) => {
        console.error('Query error:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los webinars. Por favor, intenta de nuevo más tarde.",
          variant: "destructive"
        });
      }
    }
  });

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">Error al cargar los webinars</h3>
        <p className="text-gray-500 mb-4">Por favor, intenta de nuevo más tarde</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reintentar
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="max-w-2xl mx-auto p-6 opacity-50" />
          ))}
        </div>
      </div>
    );
  }

  if (!webinars?.length) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">No hay webinars programados</h3>
        <p className="text-gray-500 mb-4">Sé el primero en crear un webinar</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {webinars.map((webinar, index) => (
        <motion.div
          key={webinar.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-3">{webinar.title}</h3>
                <p className="text-gray-600 mb-4">{webinar.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>
                      {format(webinar.startTime, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{format(webinar.startTime, "HH:mm 'hrs'")}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-500">
                    <User className="h-5 w-5 mr-2" />
                    <span>{webinar.hostName}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex md:flex-col justify-end items-stretch md:min-w-[200px]">
                <Button 
                  onClick={() => navigate(`/webinar/${webinar.id}`)}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  Unirse al Webinar
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default WebinarList;
