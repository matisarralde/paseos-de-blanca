
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Person, Walk, Schedule, View } from './types';
import { DAYS_OF_WEEK, TIME_SLOTS, GROUP_A_IDS, GROUP_B_IDS, PawIcon, CalendarIcon, TrophyIcon, CheckCircleIcon, SwapIcon, UserIcon, ClockIcon, AlertIcon } from './constants';

// UTILITY & INITIALIZATION FUNCTIONS
const getWeekNumber = (d: Date): number => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

const getWeekDateRange = (date: Date): string => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

    if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('es-ES', { day: 'numeric' })} - ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else {
        return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', { ...options, year: 'numeric' })}`;
    }
};


const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getInitialFamilyMembers = (): Person[] => {
    const initialSetup = [
        { id: 'papa', name: 'Papá', avatarColor: 'bg-sky-500', status: 'claimed' },
        { id: 'mama', name: 'Mamá', avatarColor: 'bg-pink-500', status: 'claimed' },
        { id: 'hermano1', name: 'Hermano 1', avatarColor: 'bg-emerald-500', status: 'unclaimed' },
        { id: 'hermano2', name: 'Hermano 2', avatarColor: 'bg-amber-500', status: 'unclaimed' },
        { id: 'hermano3', name: 'Hermano 3', avatarColor: 'bg-indigo-500', status: 'unclaimed' },
        { id: 'yo', name: 'Yo', avatarColor: 'bg-red-500', status: 'claimed' },
    ];
    return initialSetup.map(m => ({
        ...m,
        inviteToken: m.status === 'unclaimed' ? `${m.id}-${Date.now()}` : undefined,
    } as Person));
};

// HELPER COMPONENTS

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentUser: Person | null;
  onUserClick: () => void;
}
const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, currentUser, onUserClick }) => (
    <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20 flex-wrap">
                <div className="flex items-center space-x-3">
                    <div className="text-white bg-slate-800 p-2 rounded-full">
                        <PawIcon />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Paseos de Blanca</h1>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <nav className="flex space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-full">
                        <button
                            onClick={() => setCurrentView('schedule')}
                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-full flex items-center space-x-2 transition-colors duration-200 ${
                                currentView === 'schedule' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            <CalendarIcon />
                            <span>Calendario</span>
                        </button>
                        <button
                            onClick={() => setCurrentView('leaderboard')}
                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-full flex items-center space-x-2 transition-colors duration-200 ${
                                currentView === 'leaderboard' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            <TrophyIcon />
                            <span>Ranking</span>
                        </button>
                    </nav>
                    <button onClick={onUserClick} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex-shrink-0 flex items-center justify-center ring-2 ring-offset-2 ring-slate-200 focus:outline-none focus:ring-slate-500">
                        {currentUser ? (
                            <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg ${currentUser.avatarColor}`}>
                                {currentUser.name.charAt(0)}
                            </div>
                        ) : (
                            <div className="w-full h-full rounded-full flex items-center justify-center bg-slate-200 text-slate-500">
                                <UserIcon />
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    </header>
);


interface WalkCardProps {
  walk: Walk;
  onOpenDetail: (walkId: string) => void;
  person: Person | undefined;
}
const WalkCard: React.FC<WalkCardProps> = ({ walk, onOpenDetail, person }) => {
    if (!person) return <div className="bg-slate-100 rounded-lg min-h-[120px]"></div>;

    return (
        <button onClick={() => onOpenDetail(walk.id)} className={`p-3 rounded-lg flex flex-col items-center justify-between min-h-[120px] text-center transition-all duration-300 border w-full text-left ${walk.isCompleted ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
            <div className="flex flex-col items-center flex-grow justify-center">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${person.avatarColor} mb-2`}>
                    {person.name.charAt(0)}
                </div>
                <p className="font-semibold text-slate-800 text-sm leading-tight">{person.name}</p>
            </div>
           
            {walk.isCompleted && (
                 <div className="flex items-center text-green-600 text-xs font-medium mt-2">
                    <CheckCircleIcon />
                    <span className="ml-1.5">Completado</span>
                </div>
            )}
        </button>
    );
};


interface ScheduleBoardProps {
  schedule: Schedule;
  onOpenDetail: (walkId: string) => void;
  onGenerateNewWeek: () => void;
  family: Person[];
  isCurrentWeek: boolean;
}
const ScheduleBoard: React.FC<ScheduleBoardProps> = ({ schedule, onOpenDetail, onGenerateNewWeek, family, isCurrentWeek }) => {
    const peopleMap = useMemo(() => new Map(family.map(p => [p.id, p])), [family]);
    if (schedule.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                {isCurrentWeek ? (
                    <>
                        <p className="text-lg text-slate-500 mb-4">No hay un calendario para esta semana.</p>
                        <button onClick={onGenerateNewWeek} className="bg-slate-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-700 transition-all duration-200 shadow-lg">
                            Generar Calendario Semanal
                        </button>
                    </>
                ) : (
                    <p className="text-lg text-slate-500">No se generó un calendario para esta semana.</p>
                )}
            </div>
        )
    }

    return (
        <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-[700px] md:min-w-full">
                    <div className="grid grid-cols-[5rem_repeat(7,minmax(0,1fr))] text-center font-bold text-slate-600 text-xs sm:text-sm">
                        <div />
                        {DAYS_OF_WEEK.map(day => <div key={day} className="py-2 truncate">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-[5rem_repeat(7,minmax(0,1fr))] gap-2">
                        {TIME_SLOTS.map(timeSlot => (
                            <React.Fragment key={timeSlot}>
                                <div className="font-bold text-slate-500 flex items-center justify-center text-sm md:text-base my-2">{timeSlot}</div>
                                {DAYS_OF_WEEK.map(day => {
                                    const walk = schedule.find(w => w.day === day && w.timeSlot === timeSlot);
                                    if (!walk || !walk.personId) return <div key={day} className="bg-slate-50 rounded-lg min-h-[120px]" />;
                                    const person = peopleMap.get(walk.personId);
                                    return (
                                        <WalkCard 
                                            key={walk.id} 
                                            walk={walk}
                                            onOpenDetail={onOpenDetail}
                                            person={person}
                                        />
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface LeaderboardProps {
    scheduleHistory: Schedule;
    family: Person[];
}
const Leaderboard: React.FC<LeaderboardProps> = ({ scheduleHistory, family }) => {
    const leaderboardData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        family.forEach(p => counts[p.id] = 0);
        
        const currentMonth = new Date().getMonth();
        scheduleHistory
          .filter(walk => walk.isCompleted && new Date(walk.date).getMonth() === currentMonth)
          .forEach(walk => {
            if (walk.personId) {
                counts[walk.personId]++;
            }
        });

        return family.map(person => ({
            ...person,
            walks: counts[person.id]
        })).sort((a, b) => b.walks - a.walks);
    }, [scheduleHistory, family]);

    const maxWalks = Math.max(...leaderboardData.map(p => p.walks), 1);

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Ranking Mensual de Paseos</h2>
            <div className="space-y-4">
                {leaderboardData.map((person, index) => (
                    <div key={person.id} className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-10 text-xl font-bold text-slate-400 text-center">{index + 1}</div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-2xl ${person.avatarColor}`}>
                            {person.name.charAt(0)}
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-slate-700">{person.name}</span>
                                <span className="font-bold text-slate-800 text-lg">{person.walks} paseos</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-4">
                                <div
                                    className={`${person.avatarColor} h-4 rounded-full transition-all duration-500 ease-out`}
                                    style={{ width: `${(person.walks / maxWalks) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
}
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 text-3xl font-light">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    family: Person[];
    currentUser: Person | null;
    onSetCurrentUser: (id: string) => void;
    onUpdateUser: (id: string, newName: string) => void;
}
const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, family, currentUser, onSetCurrentUser, onUpdateUser }) => {
    const [editingUser, setEditingUser] = useState<Person | null>(null);
    const [newName, setNewName] = useState("");

    const handleEdit = (person: Person) => {
        setEditingUser(person);
        setNewName(person.name);
    };

    const handleSave = () => {
        if (editingUser && newName.trim()) {
            onUpdateUser(editingUser.id, newName.trim());
            setEditingUser(null);
            setNewName("");
        }
    };

    const handleInvite = (person: Person) => {
        const inviteUrl = `${window.location.origin}?invite_token=${person.inviteToken}`;
        navigator.clipboard.writeText(inviteUrl).then(() => {
            alert(`Enlace de invitación para ${person.name} copiado!`);
        });
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Familia">
             <div className="space-y-3">
                 <h3 className="text-sm font-semibold text-slate-500">¿Quién eres?</h3>
                 {family.filter(p => p.status === 'claimed').map(person => (
                     <button key={person.id} onClick={() => onSetCurrentUser(person.id)} className={`w-full text-left p-2 rounded-lg flex items-center space-x-3 transition-colors ${currentUser?.id === person.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-100'}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentUser?.id !== person.id ? `text-white ${person.avatarColor}` : ''}`}>
                            {person.name.charAt(0)}
                         </div>
                         <span>{person.name}</span>
                     </button>
                 ))}
                 <hr className="my-4"/>
                 <h3 className="text-sm font-semibold text-slate-500">Perfiles</h3>
                {family.map(person => (
                    <div key={person.id} className="p-2 rounded-lg flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${person.avatarColor}`}>{person.name.charAt(0)}</div>
                            {editingUser?.id === person.id ? (
                                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="border rounded px-2 py-1" autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
                            ) : (
                                <span>{person.name}</span>
                            )}
                        </div>
                        <div className="flex space-x-2">
                            {editingUser?.id === person.id ? (
                                <button onClick={handleSave} className="text-xs font-semibold bg-green-500 text-white px-2 py-1 rounded">Guardar</button>
                            ) : (
                                <>
                                    {person.status === 'claimed' ? (
                                        <button onClick={() => handleEdit(person)} className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-1 rounded">Editar</button>
                                    ) : (
                                        <button onClick={() => handleInvite(person)} className="text-xs font-semibold bg-sky-500 text-white px-2 py-1 rounded">Invitar</button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                 ))}
             </div>
        </Modal>
    );
};


interface ClaimInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    personToClaim: Person;
    onClaim: (name: string) => void;
}
const ClaimInviteModal: React.FC<ClaimInviteModalProps> = ({ isOpen, onClose, personToClaim, onClaim }) => {
    const [name, setName] = useState('');
    
    const handleSubmit = () => {
        if(name.trim()) {
            onClaim(name.trim());
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Únete como ${personToClaim.name}`}>
            <p className="mb-4 text-slate-600">¡Bienvenido! Ingresa tu nombre para reclamar tu perfil en el equipo de paseos de Blanca.</p>
            <input type="text" placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-slate-500" autoFocus />
            <button onClick={handleSubmit} className="w-full bg-slate-800 text-white font-bold py-2 rounded-lg hover:bg-slate-700 transition-colors">Confirmar</button>
        </Modal>
    );
};


interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  family: Person[];
  fromWalkId: string | null;
  onExecuteSwap: (toWalkId: string) => void;
}
const SwapModal: React.FC<SwapModalProps> = ({ isOpen, onClose, schedule, family, fromWalkId, onExecuteSwap }) => {
    const peopleMap = useMemo(() => new Map(family.map(p => [p.id, p])), [family]);
    const fromWalk = useMemo(() => schedule.find(w => w.id === fromWalkId), [schedule, fromWalkId]);
    
    if (!fromWalkId || !fromWalk) return null;
    
    const fromPerson = fromWalk.personId ? peopleMap.get(fromWalk.personId) : undefined;
    const swappableWalks = schedule.filter(w => w.id !== fromWalkId && !w.isCompleted);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Solicitar Cambio de Turno">
            <div className="bg-slate-100 p-4 rounded-lg mb-4">
                <p className="text-sm text-slate-500">Tu turno actual:</p>
                <p className="font-semibold">{fromPerson?.name} - {fromWalk.day}, {fromWalk.timeSlot}</p>
            </div>
            <p className="font-semibold mb-2">Elige un turno para cambiar:</p>
            <div className="overflow-y-auto pr-2 -mr-2 flex-grow max-h-96">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {swappableWalks.map(walk => {
                        const person = walk.personId ? peopleMap.get(walk.personId) : undefined;
                        if (!person) return null;
                        return (
                            <button key={walk.id} onClick={() => onExecuteSwap(walk.id)} className="text-left p-3 border rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors duration-200">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${person.avatarColor}`}>
                                        {person.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{person.name}</p>
                                        <p className="text-xs text-slate-500">{walk.day}, {walk.timeSlot}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};

interface WalkDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    walk: Walk | null;
    person: Person | null;
    onSave: (walkId: string, updates: { notes?: string; complete?: boolean }) => void;
    onInitiateSwap: (walkId: string) => void;
    currentUser: Person | null;
}
const WalkDetailModal: React.FC<WalkDetailModalProps> = ({ isOpen, onClose, walk, person, onSave, onInitiateSwap, currentUser }) => {
    const [notes, setNotes] = useState(walk?.notes || '');

    useEffect(() => {
        setNotes(walk?.notes || '');
    }, [walk]);

    if (!isOpen || !walk || !person) return null;

    const isCurrentUserTurn = currentUser?.id === person.id;

    const handleSave = (complete?: boolean) => {
        onSave(walk.id, { notes, complete });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${walk.day}, ${walk.timeSlot}`}>
            <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-2xl ${person.avatarColor}`}>
                        {person.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">{person.name}</p>
                        <p className="text-sm text-slate-500">Turno asignado</p>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Notas del paseo</label>
                    <textarea 
                        id="notes"
                        rows={3} 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        placeholder="¿Alguna novedad sobre el paseo de Blanca?"
                    />
                </div>
                
                {walk.isCompleted && walk.completionTime && (
                    <div className="text-sm bg-green-50 text-green-700 p-2 rounded-lg flex items-center space-x-2">
                        <CheckCircleIcon />
                        <span>Completado el {new Date(walk.completionTime).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</span>
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                    <button onClick={() => onInitiateSwap(walk.id)} className="flex-1 text-slate-700 bg-slate-200 px-4 py-3 rounded-lg hover:bg-slate-300 transition-colors font-semibold flex items-center justify-center space-x-2">
                        <SwapIcon />
                        <span>Cambiar</span>
                    </button>
                    {isCurrentUserTurn && !walk.isCompleted ? (
                         <button onClick={() => handleSave(true)} className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors font-bold">
                            Completar Paseo
                        </button>
                    ) : (
                        <button onClick={() => handleSave()} className="flex-1 bg-sky-500 text-white px-4 py-3 rounded-lg hover:bg-sky-600 transition-colors font-semibold">
                            Guardar Notas
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

interface DateNavigatorProps {
    currentDate: Date;
    onPreviousWeek: () => void;
    onNextWeek: () => void;
    onGoToToday: () => void;
}
const DateNavigator: React.FC<DateNavigatorProps> = ({ currentDate, onPreviousWeek, onNextWeek, onGoToToday }) => {
    const isFutureWeek = getStartOfWeek(currentDate) >= getStartOfWeek(new Date());

    return (
        <div className="mb-4 bg-white p-3 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-md sm:text-xl font-bold text-slate-700">{getWeekDateRange(currentDate)}</h2>
            <div className="flex items-center space-x-2">
                <button onClick={onGoToToday} className="px-3 py-1.5 text-sm font-semibold bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors">
                    Hoy
                </button>
                <div className="flex items-center">
                     <button onClick={onPreviousWeek} className="p-2 rounded-md hover:bg-slate-100 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={onNextWeek} disabled={isFutureWeek} className="p-2 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

interface LastWalkStatusProps {
    allSchedules: Schedule;
}
const LastWalkStatus: React.FC<LastWalkStatusProps> = ({ allSchedules }) => {
    const status = useMemo(() => {
        const lastCompletedWalk = allSchedules
            .filter(w => w.completionTime)
            .sort((a, b) => new Date(b.completionTime!).getTime() - new Date(a.completionTime!).getTime())[0];
        
        if (!lastCompletedWalk?.completionTime) {
            return {
                message: "Aún no hay paseos registrados. ¡Que empiece la aventura!",
                color: "bg-slate-100 text-slate-600",
                Icon: PawIcon
            };
        }

        const lastWalkTime = new Date(lastCompletedWalk.completionTime);
        const now = new Date();
        const hoursSinceLastWalk = (now.getTime() - lastWalkTime.getTime()) / (1000 * 60 * 60);
        
        const timeString = lastWalkTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        if (hoursSinceLastWalk < 5) {
            return {
                message: `Último paseo: Hoy a las ${timeString}. ¡Todo en orden!`,
                color: "bg-emerald-100 text-emerald-800",
                Icon: ClockIcon
            };
        } else if (hoursSinceLastWalk < 8) {
            return {
                message: `Último paseo: Hoy a las ${timeString}. Pronto será hora del siguiente paseo.`,
                color: "bg-amber-100 text-amber-800",
                Icon: ClockIcon
            };
        } else {
             return {
                message: `¡Atención! Han pasado más de ${Math.floor(hoursSinceLastWalk)} horas desde el último paseo.`,
                color: "bg-red-100 text-red-800",
                Icon: AlertIcon
            };
        }

    }, [allSchedules]);
    
    return (
        <div className={`mb-4 p-3 rounded-xl shadow-sm flex items-center space-x-3 text-sm sm:text-base font-medium ${status.color}`}>
            <status.Icon />
            <span>{status.message}</span>
        </div>
    );
}


// MAIN APP COMPONENT
const App: React.FC = () => {
    const [schedule, setSchedule] = useState<Schedule>([]);
    const [allSchedules, setAllSchedules] = useState<Schedule>([]);
    const [family, setFamily] = useState<Person[]>([]);
    const [currentUser, setCurrentUser] = useState<Person | null>(null);
    const [currentView, setCurrentView] = useState<View>('schedule');
    const [swapState, setSwapState] = useState<{ active: boolean, fromWalkId: string | null }>({ active: false, fromWalkId: null });
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [claimToken, setClaimToken] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [detailModalWalkId, setDetailModalWalkId] = useState<string | null>(null);


    const weekId = useMemo(() => `week-${currentDate.getFullYear()}-${getWeekNumber(currentDate)}`, [currentDate]);

    const peopleMap = useMemo(() => new Map(family.map(p => [p.id, p])), [family]);

    const loadAllSchedules = useCallback(() => {
        const allKeys = Object.keys(localStorage);
        const scheduleKeys = allKeys.filter(key => key.startsWith('week-'));
        const allLoadedSchedules = scheduleKeys.flatMap(key => {
            const item = localStorage.getItem(key);
            try {
                const parsed = item ? JSON.parse(item) : [];
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        });
        setAllSchedules(allLoadedSchedules.map((walk: Walk) => ({ ...walk, date: new Date(walk.date) })));
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const inviteToken = urlParams.get('invite_token');
        if (inviteToken) {
            setClaimToken(inviteToken);
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const storedFamily = localStorage.getItem('family');
        const loadedFamily = storedFamily ? JSON.parse(storedFamily) : getInitialFamilyMembers();
        setFamily(loadedFamily);

        const storedUserId = localStorage.getItem('currentUserId');
        if (storedUserId) {
            setCurrentUser(loadedFamily.find((p: Person) => p.id === storedUserId) || null);
        } else if (!inviteToken) {
            setUserModalOpen(true);
        }
        
        loadAllSchedules();
    }, [loadAllSchedules]);
    
    useEffect(() => {
        const storedSchedule = localStorage.getItem(weekId);
        if (storedSchedule) {
            const parsedSchedule: Schedule = JSON.parse(storedSchedule);
            setSchedule(parsedSchedule.map(walk => ({ ...walk, date: new Date(walk.date) })));
        } else {
            setSchedule([]);
        }
    }, [weekId]);

    const saveSchedule = useCallback((newSchedule: Schedule) => {
        localStorage.setItem(weekId, JSON.stringify(newSchedule));
        setSchedule(newSchedule);
        loadAllSchedules();
    }, [weekId, loadAllSchedules]);

    const saveFamily = useCallback((newFamily: Person[]) => {
        localStorage.setItem('family', JSON.stringify(newFamily));
        setFamily(newFamily);
    }, []);
    
    const generateNewWeekSchedule = useCallback(() => {
        const startOfWeek = getStartOfWeek(currentDate);
        const weekNumber = getWeekNumber(startOfWeek);

        let groupA = shuffleArray(family.filter(p => GROUP_A_IDS.includes(p.id)));
        let groupB = shuffleArray(family.filter(p => GROUP_B_IDS.includes(p.id)));
        
        if (groupA.length < 3 || groupB.length < 3) {
            alert("Los grupos de paseo no están completos. Asigna a todos los miembros reclamados.");
            return;
        }

        const groupAHasMoreWalks = weekNumber % 2 !== 0;
        const groupADays = groupAHasMoreWalks ? [0, 2, 4, 6] : [1, 3, 5];
        
        const newSchedule: Schedule = DAYS_OF_WEEK.flatMap((day, dayIndex) => {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + dayIndex);

            const dailyAssignees = groupADays.includes(dayIndex) ? shuffleArray(groupA) : shuffleArray(groupB);

            return TIME_SLOTS.map((timeSlot, timeSlotIndex) => ({
                id: `${day}-${timeSlot}`, day, timeSlot,
                personId: dailyAssignees[timeSlotIndex % dailyAssignees.length].id,
                isCompleted: false, date: dayDate,
            }));
        });
        saveSchedule(newSchedule);
    }, [saveSchedule, family, currentDate]);

    const handleSaveWalk = (walkId: string, updates: { notes?: string; complete?: boolean }) => {
        const newSchedule = schedule.map(w => {
            if (w.id === walkId) {
                const updatedWalk = { ...w, notes: updates.notes ?? w.notes };
                if (updates.complete) {
                    updatedWalk.isCompleted = true;
                    updatedWalk.completionTime = new Date().toISOString();
                }
                return updatedWalk;
            }
            return w;
        });
        saveSchedule(newSchedule);
    };

    const handleInitiateSwap = (walkId: string) => {
        setDetailModalWalkId(null);
        setTimeout(() => setSwapState({ active: true, fromWalkId: walkId }), 200);
    } 

    const handleExecuteSwap = (toWalkId: string) => {
        const fromWalk = schedule.find(w => w.id === swapState.fromWalkId);
        const toWalk = schedule.find(w => w.id === toWalkId);
        if (!fromWalk || !toWalk) return;

        const fromPersonId = fromWalk.personId;
        const newSchedule = schedule.map(w => {
            if (w.id === fromWalk.id) return { ...w, personId: toWalk.personId };
            if (w.id === toWalk.id) return { ...w, personId: fromPersonId };
            return w;
        });
        saveSchedule(newSchedule);
        setSwapState({ active: false, fromWalkId: null });
    };

    const handleSetCurrentUser = (id: string) => {
        const user = family.find(p => p.id === id);
        if(user) {
            setCurrentUser(user);
            localStorage.setItem('currentUserId', id);
            setUserModalOpen(false);
        }
    };
    
    const handleUpdateUser = (id: string, newName: string) => {
        const newFamily = family.map(p => p.id === id ? { ...p, name: newName } : p);
        saveFamily(newFamily);
        if(currentUser?.id === id) {
             setCurrentUser(newFamily.find(p => p.id === id) || null);
        }
    };

    const handleClaimInvite = (name: string) => {
        const personToClaim = family.find(p => p.inviteToken === claimToken);
        if (personToClaim) {
            const newFamily = family.map(p => p.id === personToClaim.id ? { ...p, name, status: 'claimed' as 'claimed', inviteToken: undefined } : p);
            saveFamily(newFamily);
            handleSetCurrentUser(personToClaim.id);
            setClaimToken(null);
        }
    };
    
    const handlePreviousWeek = () => setCurrentDate(prev => { const d = new Date(prev); d.setDate(prev.getDate() - 7); return d; });
    const handleNextWeek = () => setCurrentDate(prev => { const d = new Date(prev); d.setDate(prev.getDate() + 7); return d; });
    const handleGoToToday = () => setCurrentDate(new Date());

    const personToClaim = useMemo(() => family.find(p => p.inviteToken === claimToken), [family, claimToken]);
    const isCurrentWeek = useMemo(() => weekId === `week-${new Date().getFullYear()}-${getWeekNumber(new Date())}`, [weekId]);
    const walkForDetailModal = useMemo(() => schedule.find(w => w.id === detailModalWalkId), [schedule, detailModalWalkId]);
    const personForDetailModal = useMemo(() => walkForDetailModal?.personId ? peopleMap.get(walkForDetailModal.personId) : null, [walkForDetailModal, peopleMap]);

    return (
        <div className="min-h-screen bg-slate-50">
            <Header currentView={currentView} setCurrentView={setCurrentView} currentUser={currentUser} onUserClick={() => setUserModalOpen(true)} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {currentView === 'schedule' ? (
                    <>
                    <DateNavigator 
                        currentDate={currentDate} 
                        onPreviousWeek={handlePreviousWeek}
                        onNextWeek={handleNextWeek}
                        onGoToToday={handleGoToToday}
                    />
                    <LastWalkStatus allSchedules={allSchedules} />
                    <ScheduleBoard 
                        schedule={schedule} 
                        onOpenDetail={setDetailModalWalkId}
                        onGenerateNewWeek={generateNewWeekSchedule}
                        family={family}
                        isCurrentWeek={isCurrentWeek}
                    />
                    </>
                ) : (
                    <Leaderboard scheduleHistory={allSchedules} family={family} />
                )}
            </main>

            <UserManagementModal 
                isOpen={isUserModalOpen}
                onClose={() => setUserModalOpen(false)}
                family={family}
                currentUser={currentUser}
                onSetCurrentUser={handleSetCurrentUser}
                onUpdateUser={handleUpdateUser}
            />

            {personToClaim && (
                <ClaimInviteModal
                    isOpen={!!claimToken}
                    onClose={() => setClaimToken(null)}
                    personToClaim={personToClaim}
                    onClaim={handleClaimInvite}
                />
            )}
            
            <SwapModal 
                isOpen={swapState.active}
                onClose={() => setSwapState({ active: false, fromWalkId: null })}
                schedule={schedule}
                family={family}
                fromWalkId={swapState.fromWalkId}
                onExecuteSwap={handleExecuteSwap}
            />

            <WalkDetailModal
                isOpen={!!detailModalWalkId}
                onClose={() => setDetailModalWalkId(null)}
                walk={walkForDetailModal || null}
                person={personForDetailModal || null}
                onSave={handleSaveWalk}
                onInitiateSwap={handleInitiateSwap}
                currentUser={currentUser}
            />
        </div>
    );
};

export default App;