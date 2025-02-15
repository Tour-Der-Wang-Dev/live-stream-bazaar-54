
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Video, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertDescription } from "@/components/ui/alert";

const CreateWebinar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkTeacherStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_teacher')
          .eq('id', user.id)
          .single();
        
        setIsTeacher(profile?.is_teacher || false);
      }
    };

    checkTeacherStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const startTime = formData.get('startTime') as string;
    const roomName = uuidv4();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user logged in');
      }

      const { error } = await supabase
        .from('webinars')
        .insert({
          title,
          description,
          start_time: startTime,
          host_name: user.email,
          room_name: roomName
        });

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            variant: "destructive",
            title: "Error de permisos",
            description: "Solo los profesores pueden crear webinars.",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Webinar creado con éxito",
        description: "Tu webinar ha sido programado correctamente.",
      });

      navigate("/");
    } catch (error) {
      console.error('Error creating webinar:', error);
      toast({
        variant: "destructive",
        title: "Error al crear el webinar",
        description: "Por favor intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isTeacher === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Lo sentimos, solo los profesores pueden crear webinars.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              Volver al inicio
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-2xl mx-auto p-8 shadow-lg">
            <h1 className="text-3xl font-bold mb-2 text-center">Crear Nuevo Webinar</h1>
            <p className="text-gray-500 text-center mb-8">Programa tu próxima sesión en vivo</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Título del Webinar
                </label>
                <Input
                  name="title"
                  required
                  placeholder="Ej: Introducción a React"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descripción
                </label>
                <Textarea
                  name="description"
                  required
                  placeholder="Describe tu webinar..."
                  className="w-full min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fecha y Hora
                </label>
                <Input
                  name="startTime"
                  type="datetime-local"
                  required
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  <Video className="mr-2 h-5 w-5" />
                  {loading ? "Creando..." : "Crear Webinar"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateWebinar;
