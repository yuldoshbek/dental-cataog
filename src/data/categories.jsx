import React from 'react';
import {
    Stethoscope, Wind, Thermometer, Activity,
    ScanFace, Camera, Monitor, Zap
} from 'lucide-react';

export const categories = [
    { id: 'units', name: 'Установки', icon: <Stethoscope size={20} /> },
    { id: 'compressors', name: 'Компрессоры', icon: <Wind size={20} /> },
    { id: 'autoclaves', name: 'Автоклавы', icon: <Thermometer size={20} /> },
    { id: 'physio', name: 'Физиодиспенсеры', icon: <Activity size={20} /> },
    { id: 'scanners', name: 'Интраоральные сканеры', icon: <ScanFace size={20} /> },
    { id: 'xray', name: 'Рентгены портативные', icon: <Camera size={20} /> },
    { id: 'visiographs', name: 'Визиографы', icon: <Monitor size={20} /> },
    { id: 'handpieces', name: 'Наконечники', icon: <Zap size={20} /> },
];
