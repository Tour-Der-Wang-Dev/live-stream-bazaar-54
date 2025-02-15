
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams, useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  VideoConference,
  PreJoin,
  LocalUserChoices,
  useLocalParticipant,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import {
  Track,
  RoomEvent,
  Room,
  DataPacket_Kind,
  RemoteParticipant,
} from 'livekit-client';
import "@livekit/components-styles";
import { motion } from "framer-motion";
import { Webinar } from "@/types/webinar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Mic, Calendar, Clock } from "lucide-react";

const fetchWebinar = async (id: string): Promise<Webinar | null> => {
  console.log('Fetching webinar with ID:', id);
  
  if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error('ID inválido:', id);
    return null;
  }

  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener webinar:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    startTime: new Date(data.start_time),
    hostName: data.host_name,
    roomName: data.room_name
  };
};

const WebinarContent = ({ 
  webinarId, 
  onDisconnect 
}: { 
  webinarId: string;
  onDisconnect: () => void;
}) => {
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const { toast } = useToast();
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks();

  useEffect(() => {
    if (!localParticipant) return;
    
    console.log('Local participant ready:', localParticipant.identity);

    const handleTranscript = async (text: string) => {
      console.log('Processing transcript:', text);
      try {
        const { error } = await supabase.functions.invoke('webinar-agent', {
          body: {
            action: 'save_transcript',
            webinarId,
            text
          }
        });

        if (error) throw error;
        setTranscript(prev => prev + " " + text);
      } catch (error) {
        console.error('Error saving transcript:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar la transcripción"
        });
      }
    };

    const handleMessage = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        console.log('Received message:', text);
        
        // Intentar parsear como JSON primero
        try {
          const data = JSON.parse(text);
          if (data.type === 'transcript') {
            handleTranscript(data.content);
          }
        } catch {
          // Si no es JSON, tratar como transcripción directa
          handleTranscript(text);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    // Suscribirse a eventos de datos
    localParticipant.on(RoomEvent.DataReceived, handleMessage);

    // Enviar mensaje de prueba
    const sendTestMessage = async () => {
      try {
        const message = {
          type: 'transcript',
          content: `Test transcript from ${localParticipant.identity}`
        };
        const encoded = new TextEncoder().encode(JSON.stringify(message));
        await localParticipant.publishData(encoded, DataPacket_Kind.RELIABLE);
        console.log('Test message sent');
      } catch (e) {
        console.error('Error sending test message:', e);
      }
    };
    sendTestMessage();

    return () => {
      localParticipant.off(RoomEvent.DataReceived, handleMessage);
    };
  }, [localParticipant, webinarId]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !localParticipant) return;

    setIsAskingQuestion(true);
    try {
      // Publicar la pregunta
      const questionMsg = {
        type: 'question',
        content: question
      };
      await localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(questionMsg)),
        DataPacket_Kind.RELIABLE
      );

      const { data, error } = await supabase.functions.invoke('webinar-agent', {
        body: {
          action: 'ask_question',
          webinarId,
          question
        }
      });

      if (error) throw error;
      console.log('Answer received:', data);
      setAnswer(data.answer);
      setQuestion("");

      // Publicar la respuesta
      const answerMsg = {
        type: 'answer',
        content: data.answer
      };
      await localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(answerMsg)),
        DataPacket_Kind.RELIABLE
      );

    } catch (error) {
      console.error('Error asking question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar tu pregunta"
      });
    } finally {
      setIsAskingQuestion(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <RoomAudioRenderer />
      <div className="flex-1 p-4">
        <div className="rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-gray-800">
          <VideoConference />
        </div>
      </div>
      
      <div className="h-2/5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="container mx-auto p-6 h-full flex gap-6">
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Transcripción en vivo</h3>
            </div>
            <ScrollArea className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {transcript || "La transcripción aparecerá aquí cuando comience..."}
              </p>
            </ScrollArea>
          </div>

          <div className="w-[400px] flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold">Asistente del Webinar</h3>
            </div>
            <ScrollArea className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
              {answer ? (
                <div className="p-4 bg-green-50 dark:bg-gray-700 rounded-lg border border-green-100 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300">{answer}</p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center mt-4">
                  Haz una pregunta sobre el contenido del webinar
                </p>
              )}
            </ScrollArea>

            <form onSubmit={handleAskQuestion} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Haz una pregunta sobre el webinar..."
                disabled={isAskingQuestion}
                className="bg-white dark:bg-gray-800"
              />
              <Button 
                type="submit" 
                disabled={isAskingQuestion}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Preguntar
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const WebinarRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [liveKitUrl] = useState("wss://juliawebinars-brslrae2.livekit.cloud");

  const { data: webinar, isLoading } = useQuery({
    queryKey: ['webinar', id],
    queryFn: () => fetchWebinar(id || ''),
    enabled: !!id
  });

  const generateToken = async (participantName: string): Promise<string> => {
    try {
      if (!webinar?.roomName) {
        throw new Error('Nombre de sala no encontrado');
      }

      console.log('Generando token para:', participantName, 'en sala:', webinar.roomName);
      
      const { data, error } = await supabase.functions.invoke('generate-livekit-token', {
        body: {
          roomName: webinar.roomName,
          participantName
        },
      });

      if (error) throw error;
      if (!data?.token) throw new Error('Token no recibido');

      console.log('Token generado exitosamente');
      return data.token;
    } catch (err: any) {
      console.error('Error generando token:', err);
      throw new Error('Error al generar el token de acceso: ' + err.message);
    }
  };

  const handleJoinWebinar = async (values: LocalUserChoices) => {
    try {
      setIsJoining(true);
      setError('');
      
      console.log('Iniciando proceso de unión al webinar');
      const newToken = await generateToken(values.username);
      
      console.log('Token obtenido, conectando a LiveKit');
      setToken(newToken);
    } catch (err: any) {
      console.error('Error al unirse al webinar:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error al unirse",
        description: err.message
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading || !webinar) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 shadow-xl">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {token ? (
        <LiveKitRoom
          token={token}
          serverUrl={liveKitUrl}
          connect={true}
          video={true}
          audio={true}
          onDisconnected={() => {
            console.log('Desconectado de LiveKit');
            navigate("/");
          }}
        >
          <WebinarContent webinarId={id || ''} onDisconnect={() => navigate("/")} />
        </LiveKitRoom>
      ) : (
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-2xl mx-auto p-8 shadow-2xl">
              <h1 className="text-3xl font-bold mb-6 text-center">{webinar.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8 text-center leading-relaxed">
                {webinar.description}
              </p>
              
              <div className="flex justify-center gap-8 mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {webinar.startTime.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {webinar.startTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <PreJoin
                onError={(err) => setError(err.message)}
                onSubmit={handleJoinWebinar}
              />
              
              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 mt-4 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded"
                >
                  {error}
                </motion.p>
              )}
              
              {isJoining && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-blue-500 mt-4 text-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded"
                >
                  Conectando al webinar...
                </motion.p>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WebinarRoom;
