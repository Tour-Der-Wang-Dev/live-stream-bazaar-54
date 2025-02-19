
import { useEffect, useState, useRef } from "react";
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
  useLiveKitRoom,
} from "@livekit/components-react";
import {
  Track,
  RoomEvent,
  Room,
  DataPacket_Kind,
  RemoteParticipant,
  LocalParticipant,
  LocalTrackPublication,
  LocalAudioTrack,
} from 'livekit-client';
import "@livekit/components-styles";
import { motion } from "framer-motion";
import { Webinar } from "@/types/webinar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Mic, Calendar, Clock, Video, VideoOff } from "lucide-react";

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
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const { localParticipant } = useLocalParticipant();
  const { room } = useLiveKitRoom();
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recordingTimeout = useRef<NodeJS.Timeout>();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const setupComplete = useRef(false);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleDownloadTranscript = () => {
    const element = document.createElement("a");
    const file = new Blob([transcript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcripcion-${webinarId}-${new Date().toISOString()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const toggleRecording = async () => {
    try {
      if (!room) {
        throw new Error('La sala no está disponible');
      }

      if (isRecording) {
        const { error } = await supabase.functions.invoke('webinar-agent', {
          body: {
            action: 'stop_recording',
            webinarId,
            roomName: room.name
          }
        });

        if (error) throw error;

        setIsRecording(false);
        toast({
          title: "Grabación detenida",
          description: "La grabación se ha detenido correctamente"
        });
      } else {
        const { error } = await supabase.functions.invoke('webinar-agent', {
          body: {
            action: 'start_recording',
            webinarId,
            roomName: room.name
          }
        });

        if (error) throw error;

        setIsRecording(true);
        toast({
          title: "Grabación iniciada",
          description: "La videoconferencia está siendo grabada"
        });
      }
    } catch (error: any) {
      console.error('Error al gestionar la grabación:', error);
      toast({
        variant: "destructive",
        title: "Error en la grabación",
        description: error.message || "No se pudo gestionar la grabación"
      });
    }
  };

  useEffect(() => {
    let recorder: MediaRecorder | null = null;

    const setupAudioRecording = async () => {
      if (!localParticipant || setupComplete.current) return;

      try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const audioPublication = Array.from(localParticipant.tracks.values())
          .find(pub => pub.kind === Track.Kind.Audio);

        if (!audioPublication) {
          console.error('[Transcription] No se encontró publicación de audio');
          return;
        }

        const audioTrack = audioPublication.track as LocalAudioTrack;
        
        if (!audioTrack || !audioTrack.mediaStream) {
          console.error('[Transcription] No se encontró track de audio válido');
          return;
        }

        console.log('[Transcription] Audio track encontrado:', {
          id: audioTrack.sid,
          muted: audioTrack.isMuted
        });

        if (!window.MediaRecorder) {
          throw new Error('MediaRecorder no está soportado en este navegador');
        }

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        recorder = new MediaRecorder(audioTrack.mediaStream, {
          mimeType,
          audioBitsPerSecond: 128000
        });

        console.log('[Transcription] MediaRecorder creado con configuración:', {
          mimeType: recorder.mimeType,
          state: recorder.state
        });

        recorder.ondataavailable = (event) => {
          console.log('[Transcription] Datos de audio recibidos:', event.data.size, 'bytes');
          if (event.data.size > 0) {
            chunks.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          if (chunks.current.length === 0) {
            console.log('[Transcription] No hay datos de audio para procesar');
            startRecording(recorder!);
            return;
          }

          const audioBlob = new Blob(chunks.current, { type: mimeType });
          console.log('[Transcription] Blob de audio creado:', audioBlob.size, 'bytes');
          chunks.current = [];

          if (audioBlob.size < 1000) {
            console.log('[Transcription] Blob demasiado pequeño, ignorando');
            startRecording(recorder!);
            return;
          }

          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              console.log('[Transcription] Enviando audio para transcripción...');
              const { data, error } = await supabase.functions.invoke('webinar-agent', {
                body: {
                  action: 'transcribe_audio',
                  audio: base64Audio,
                  webinarId
                }
              });

              if (error) {
                console.error('[Transcription] Error en la función edge:', error);
                throw error;
              }
              
              if (data?.text) {
                console.log('[Transcription] Texto recibido:', data.text);
                const timestamp = new Date().toLocaleTimeString();
                setTranscript(prev => {
                  const newEntry = `[${timestamp}] ${data.text.trim()}`;
                  return prev ? `${prev}\n${newEntry}` : newEntry;
                });

                await supabase.from('webinar_transcriptions').insert({
                  webinar_id: webinarId,
                  transcript: data.text.trim(),
                  created_at: new Date().toISOString()
                });
              }
            } catch (error) {
              console.error('[Transcription] Error:', error);
              toast({
                variant: "destructive",
                title: "Error en la transcripción",
                description: "No se pudo procesar el audio"
              });
            }

            startRecording(recorder!);
          };

          reader.readAsDataURL(audioBlob);
        };

        setMediaRecorder(recorder);
        setupComplete.current = true;
        startRecording(recorder);

        console.log('[Transcription] Configuración completada');
        toast({
          title: "Transcripción iniciada",
          description: "El audio está siendo procesado"
        });
      } catch (error) {
        console.error('[Transcription] Error en la configuración:', error);
        toast({
          variant: "destructive",
          title: "Error en la transcripción",
          description: "No se pudo iniciar la grabación de audio"
        });
      }
    };

    const startRecording = (rec: MediaRecorder) => {
      if (!rec) return;

      try {
        if (recordingTimeout.current) {
          clearTimeout(recordingTimeout.current);
        }

        if (rec.state === 'recording') {
          rec.stop();
        }

        chunks.current = [];
        rec.start();
        console.log('[Transcription] Grabación iniciada');

        recordingTimeout.current = setTimeout(() => {
          if (rec.state === 'recording') {
            console.log('[Transcription] Deteniendo grabación por timeout');
            rec.stop();
          }
        }, 10000);
      } catch (error) {
        console.error('[Transcription] Error al iniciar grabación:', error);
      }
    };

    if (localParticipant) {
      setupAudioRecording();
    }

    return () => {
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
      }
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
      }
      setupComplete.current = false;
    };
  }, [localParticipant, webinarId]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !localParticipant) return;

    setIsAskingQuestion(true);
    try {
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
        <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-gray-800">
          <div className="absolute top-4 right-4 z-10">
            <Button
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              className="flex items-center gap-2"
            >
              {isRecording ? (
                <>
                  <VideoOff className="w-4 h-4" />
                  Detener Grabación
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  Iniciar Grabación
                </>
              )}
            </Button>
          </div>
          <VideoConference />
        </div>
      </div>
      
      <div className="h-1/2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="container mx-auto p-6 h-full flex gap-6">
          <div className="w-[400px] flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Transcripción en vivo</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadTranscript}
                className="text-sm"
              >
                Descargar
              </Button>
            </div>
            <ScrollArea 
              className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              ref={transcriptRef}
            >
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                {transcript || "La transcripción aparecerá aquí cuando comience..."}
              </p>
            </ScrollArea>
          </div>

          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-6 h-6 text-green-500" />
              <h3 className="text-xl font-semibold">Asistente del Webinar</h3>
            </div>
            <ScrollArea className="flex-1 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
              {answer ? (
                <div className="p-8 bg-green-50 dark:bg-gray-700 rounded-lg border border-green-100 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                    {answer}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center mt-4 text-lg">
                  Haz una pregunta sobre el contenido del webinar
                </p>
              )}
            </ScrollArea>

            <form onSubmit={handleAskQuestion} className="flex gap-3">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Haz una pregunta sobre el webinar..."
                disabled={isAskingQuestion}
                className="bg-white dark:bg-gray-800 text-lg py-6"
              />
              <Button 
                type="submit" 
                disabled={isAskingQuestion}
                className="bg-green-600 hover:bg-green-700 text-white px-8 text-lg"
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
