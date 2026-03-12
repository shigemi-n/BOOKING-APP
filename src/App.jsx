import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Ticket, User, CheckCircle, ChevronRight, ChevronLeft, Info, Plus, Minus, Settings, Trash2, Home, Users } from 'lucide-react';

// --- モックデータ・定数設定 ---
const INITIAL_TICKET_TYPES = [
  { id: 'adult', name: '大人', price: 2000, desc: '18歳以上' },
  { id: 'child', name: '子供', price: 1000, desc: '小学生〜高校生' },
  { id: 'senior', name: 'シニア', price: 1500, desc: '65歳以上' },
];

const STATUS_MAP = {
  available: { label: '〇', color: 'text-green-600', bgColor: 'bg-green-50', text: '空きあり' },
  few: { label: '△', color: 'text-orange-500', bgColor: 'bg-orange-50', text: '残りわずか' },
  full: { label: '×', color: 'text-red-500', bgColor: 'bg-red-50', text: '満席' },
  closed: { label: '－', color: 'text-gray-500', bgColor: 'bg-gray-100', text: '休業日' }
};

const STEPS = [
  { id: 1, title: '日にち選択', icon: Calendar },
  { id: 2, title: 'チケット・人数', icon: Ticket },
  { id: 3, title: '情報入力', icon: User },
  { id: 4, title: '確認', icon: CheckCircle },
];

// 直近14日間の初期日付データを生成
const generateInitialDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    dates.push({
      fullDate: `${year}-${month}-${day}`,
      dateString: `${date.getMonth() + 1}月${date.getDate()}日`,
      dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
      status: 'available' // 初期状態はすべて空き
    });
  }
  return dates;
};

// ==========================================
// メインアプリケーションコンポーネント
// ==========================================
export default function BookingApp() {
  const [viewMode, setViewMode] = useState('user'); // 'user' | 'admin'
  
  // --- グローバルステート（管理画面とユーザー画面で共有） ---
  const [ticketTypes, setTicketTypes] = useState(INITIAL_TICKET_TYPES);
  const [availableDates, setAvailableDates] = useState(generateInitialDates());
  const [maxPeople, setMaxPeople] = useState(10); // 1予約あたりの最大人数

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm px-4 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">イベント予約システム</h1>
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'user' ? 'admin' : 'user')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            viewMode === 'user' 
              ? 'bg-gray-800 text-white hover:bg-gray-900' 
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {viewMode === 'user' ? (
            <><Settings className="w-4 h-4 mr-2" /> 管理画面へ</>
          ) : (
            <><Home className="w-4 h-4 mr-2" /> ユーザー画面へ戻る</>
          )}
        </button>
      </header>

      {/* メインコンテンツ切り替え */}
      <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {viewMode === 'user' ? (
          <UserView 
            ticketTypes={ticketTypes} 
            availableDates={availableDates} 
            maxPeople={maxPeople} 
          />
        ) : (
          <AdminView 
            ticketTypes={ticketTypes} setTicketTypes={setTicketTypes}
            availableDates={availableDates} setAvailableDates={setAvailableDates}
            maxPeople={maxPeople} setMaxPeople={setMaxPeople}
          />
        )}
      </main>
    </div>
  );
}

// ==========================================
// ユーザー画面コンポーネント (予約フロー)
// ==========================================
function UserView({ ticketTypes, availableDates, maxPeople }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [ticketsCount, setTicketsCount] = useState({});
  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '' });

  // カレンダー表示用の現在の年月管理
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // カレンダーの日にちを生成するヘルパー
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 月の最初の日と最後の日
    const firstDayOfMonth = new Date(year, month, 1);
    
    // カレンダーの開始日（前の月の残りの日数分を埋める）
    const startDay = new Date(firstDayOfMonth);
    startDay.setDate(1 - firstDayOfMonth.getDay());
    
    const days = [];
    const tempDate = new Date(startDay);
    
    // 6週間分（42日）の日付を生成
    for (let i = 0; i < 42; i++) {
      const dateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
      
      // availableDatesから該当する日付のステータスを探す
      const dateInfo = availableDates.find(d => d.fullDate === dateStr);
      
      days.push({
        fullDate: dateStr,
        day: tempDate.getDate(),
        month: tempDate.getMonth(),
        isCurrentMonth: tempDate.getMonth() === month,
        status: dateInfo ? dateInfo.status : 'closed', // データがない日は休業扱い
        dateString: dateInfo ? dateInfo.dateString : ''
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return days;
  }, [currentMonth, availableDates]);

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  // チケット種類が変更されたらカウント用ステートを初期化
  useEffect(() => {
    setTicketsCount(prev => {
      const next = { ...prev };
      ticketTypes.forEach(t => {
        if (next[t.id] === undefined) next[t.id] = 0;
      });
      // 削除されたチケットのカウントを除外
      Object.keys(next).forEach(key => {
        if (!ticketTypes.find(t => t.id === key)) delete next[key];
      });
      return next;
    });
  }, [ticketTypes]);

  // 合計人数の計算
  const totalPeople = useMemo(() => {
    return Object.values(ticketsCount).reduce((sum, count) => sum + count, 0);
  }, [ticketsCount]);

  // 合計金額の計算
  const totalPrice = useMemo(() => {
    return ticketTypes.reduce((sum, type) => {
      return sum + ((ticketsCount[type.id] || 0) * type.price);
    }, 0);
  }, [ticketsCount, ticketTypes]);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const updateTicketCount = (typeId, delta) => {
    setTicketsCount(prev => {
      const newCount = (prev[typeId] || 0) + delta;
      
      if (newCount < 0) return prev; // 0未満にはしない
      if (delta > 0 && totalPeople >= maxPeople) return prev; // 最大人数を超えない

      return { ...prev, [typeId]: newCount };
    });
  };

  // ステップ1: 日にち選択 (カレンダー形式)
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">ご希望の日にちを選択してください</h2>
        <div className="flex items-center space-x-4">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-lg">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
            <div key={day} className={`py-2 text-center text-xs font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 divide-x divide-y">
          {calendarDays.map((d, i) => {
            const isSelected = selectedDate === d.fullDate;
            const isUnavailable = d.status === 'full' || d.status === 'closed' || !d.isCurrentMonth;
            const statusObj = STATUS_MAP[d.status];

            return (
              <button
                key={i}
                disabled={isUnavailable}
                onClick={() => setSelectedDate(d.fullDate)}
                className={`
                  h-24 p-1 flex flex-col items-center justify-start transition-all relative
                  ${!d.isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-blue-50'}
                  ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500 z-10' : ''}
                  ${isUnavailable && d.isCurrentMonth ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className={`text-sm font-medium ${!d.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}`}>
                  {d.day}
                </span>
                
                {d.isCurrentMonth && (
                  <div className="mt-auto mb-1 flex flex-col items-center">
                    <span className={`text-lg font-bold ${statusObj.color}`}>
                      {statusObj.label}
                    </span>
                    <span className="text-[10px] scale-90 text-gray-500">
                      {statusObj.text}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 py-2">
        {Object.entries(STATUS_MAP).map(([key, value]) => (
          <div key={key} className="flex items-center">
            <span className={`font-bold mr-1 ${value.color}`}>{value.label}</span>
            <span>{value.text}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <button
          disabled={!selectedDate}
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg flex items-center transition-colors shadow-sm"
        >
          次へ進む <ChevronRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // ステップ2: チケット・人数指定
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800">チケットと人数を選択してください</h2>
        <span className="text-sm text-gray-500">最大 {maxPeople}名 まで</span>
      </div>
      
      {ticketTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">チケットが設定されていません。</div>
      ) : (
        <div className="space-y-4">
          {ticketTypes.map((type) => (
            <div key={type.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="mb-3 sm:mb-0">
                <h3 className="text-lg font-bold text-gray-800">{type.name}</h3>
                <p className="text-sm text-gray-500">{type.desc}</p>
                <p className="text-blue-600 font-bold mt-1">¥{Number(type.price).toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-4 self-end sm:self-auto">
                <button
                  onClick={() => updateTicketCount(type.id, -1)}
                  disabled={!ticketsCount[type.id]}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-8 text-center text-xl font-bold text-gray-800">{ticketsCount[type.id] || 0}</span>
                <button
                  onClick={() => updateTicketCount(type.id, 1)}
                  disabled={totalPeople >= maxPeople}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
        <span className="text-gray-700 font-bold">合計金額 ({totalPeople}名)</span>
        <span className="text-2xl font-bold text-blue-700">¥{totalPrice.toLocaleString()}</span>
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={handlePrev} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg flex items-center transition-colors">
          <ChevronLeft className="mr-2 w-5 h-5" /> 戻る
        </button>
        <button
          disabled={totalPeople === 0}
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg flex items-center transition-colors"
        >
          次へ進む <ChevronRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // ステップ3: ユーザー情報入力
  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">ご予約者情報を入力してください</h2>
      <div className="space-y-4 bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">お名前 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={userInfo.name}
            onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="山田 太郎"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={userInfo.email}
            onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="taro@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電話番号 <span className="text-red-500">*</span></label>
          <input
            type="tel"
            value={userInfo.phone}
            onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="090-1234-5678"
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={handlePrev} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg flex items-center transition-colors">
          <ChevronLeft className="mr-2 w-5 h-5" /> 戻る
        </button>
        <button
          disabled={!userInfo.name || !userInfo.email || !userInfo.phone}
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg flex items-center transition-colors"
        >
          確認画面へ <ChevronRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // ステップ4: 予約内容確認
  const renderStep4 = () => {
    const selectedDateObj = availableDates.find(d => d.fullDate === selectedDate);
    
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">ご予約内容の確認</h2>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* 日時 */}
          <div className="p-4 border-b border-gray-200 flex items-start">
            <Calendar className="w-6 h-6 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 font-medium">ご予約日時</p>
              <p className="text-lg font-bold text-gray-800">{selectedDateObj?.dateString} ({selectedDateObj?.dayOfWeek})</p>
            </div>
          </div>
          
          {/* チケット・人数 */}
          <div className="p-4 border-b border-gray-200 flex items-start">
            <Ticket className="w-6 h-6 text-gray-400 mr-3 mt-0.5" />
            <div className="w-full">
              <p className="text-sm text-gray-500 font-medium mb-2">チケット・人数</p>
              {ticketTypes.map(type => ticketsCount[type.id] > 0 && (
                <div key={type.id} className="flex justify-between mb-1">
                  <span className="text-gray-800">{type.name} x {ticketsCount[type.id]}名</span>
                  <span className="text-gray-600">¥{(type.price * ticketsCount[type.id]).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-800">合計</span>
                <span className="font-bold text-blue-600 text-xl">¥{totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* お客様情報 */}
          <div className="p-4 flex items-start">
            <User className="w-6 h-6 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 font-medium mb-2">お客様情報</p>
              <p className="text-gray-800 mb-1"><span className="text-gray-500 text-sm w-16 inline-block">お名前:</span> {userInfo.name}</p>
              <p className="text-gray-800 mb-1"><span className="text-gray-500 text-sm w-16 inline-block">Email:</span> {userInfo.email}</p>
              <p className="text-gray-800"><span className="text-gray-500 text-sm w-16 inline-block">電話番号:</span> {userInfo.phone}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg flex items-start">
          <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            上記の内容で予約を確定します。この操作は取り消せません。
          </p>
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={handlePrev} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg flex items-center transition-colors">
            <ChevronLeft className="mr-2 w-5 h-5" /> 修正する
          </button>
          <button
            onClick={handleNext}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg flex items-center shadow-md transition-all hover:shadow-lg"
          >
            予約を確定する <CheckCircle className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // ステップ5: 完了画面
  const renderStep5 = () => (
    <div className="text-center py-10 space-y-6 bg-white rounded-2xl shadow-xl p-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">ご予約が完了しました！</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        予約番号: <span className="font-mono font-bold text-gray-800">RES-{Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}</span><br />
        ご入力いただいたメールアドレスに予約確認メールを送信しました。
      </p>
      <div className="pt-8">
        <button
          onClick={() => {
            setCurrentStep(1);
            setSelectedDate(null);
            setTicketsCount({});
            setUserInfo({ name: '', email: '', phone: '' });
          }}
          className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          最初から予約する
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* プログレスバー (完了画面以外) */}
      {currentStep < 5 && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 hidden sm:block">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
            <div 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-500 z-0 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            ></div>

            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center bg-gray-50 px-2">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 bg-white
                    ${isActive ? 'bg-blue-600 border-blue-600 text-white' : ''}
                    ${isCompleted ? 'bg-blue-100 border-blue-500 text-blue-600' : ''}
                    ${!isActive && !isCompleted ? 'border-gray-300 text-gray-400' : ''}
                  `}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-xs font-bold ${isActive || isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* コンテンツエリア */}
      <div className="p-6 sm:p-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>
    </div>
  );
}

// ==========================================
// 管理画面コンポーネント
// ==========================================
function AdminView({ 
  ticketTypes, setTicketTypes, 
  availableDates, setAvailableDates,
  maxPeople, setMaxPeople 
}) {
  const [activeTab, setActiveTab] = useState('dates'); // 'dates' | 'tickets' | 'settings'

  // --- 状態更新ハンドラー ---
  const handleUpdateDateStatus = (fullDate, newStatus) => {
    setAvailableDates(availableDates.map(d => 
      d.fullDate === fullDate ? { ...d, status: newStatus } : d
    ));
  };

  const handleUpdateTicket = (id, field, value) => {
    setTicketTypes(ticketTypes.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleAddTicket = () => {
    const newId = 'ticket_' + Date.now();
    setTicketTypes([...ticketTypes, { id: newId, name: '新規チケット', price: 0, desc: '' }]);
  };

  const handleDeleteTicket = (id) => {
    setTicketTypes(ticketTypes.filter(t => t.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gray-800 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Settings className="w-5 h-5 mr-2" /> 管理ダッシュボード
        </h2>
      </div>

      {/* タブナビゲーション */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('dates')}
          className={`flex-1 py-4 text-sm font-bold flex justify-center items-center transition-colors border-b-2 ${
            activeTab === 'dates' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4 mr-2" /> 日にち設定
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 py-4 text-sm font-bold flex justify-center items-center transition-colors border-b-2 ${
            activeTab === 'tickets' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Ticket className="w-4 h-4 mr-2" /> チケット設定
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-4 text-sm font-bold flex justify-center items-center transition-colors border-b-2 ${
            activeTab === 'settings' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 mr-2" /> 人数・全体設定
        </button>
      </div>

      <div className="p-6">
        {/* --- タブ1: 日にち設定 --- */}
        {activeTab === 'dates' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">各日付の予約受付状況を変更します。「休業日」や「満席」に設定すると、ユーザーは選択できなくなります。</p>
            <div className="bg-white border rounded-lg divide-y">
              {availableDates.map(date => (
                <div key={date.fullDate} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-16 font-bold text-gray-700">{date.dateString}</div>
                    <div className="text-sm text-gray-500">({date.dayOfWeek})</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold ${STATUS_MAP[date.status].bgColor} ${STATUS_MAP[date.status].color}`}>
                      {STATUS_MAP[date.status].text}
                    </span>
                    <select
                      value={date.status}
                      onChange={e => handleUpdateDateStatus(date.fullDate, e.target.value)}
                      className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm py-2 px-3 border outline-none bg-white"
                    >
                      <option value="available">空きあり</option>
                      <option value="few">残りわずか</option>
                      <option value="full">満席</option>
                      <option value="closed">休業日</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- タブ2: チケット設定 --- */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">予約時にユーザーが選択できるチケットの種類、料金、説明文を設定します。</p>
            
            <div className="space-y-4">
              {ticketTypes.map((ticket, index) => (
                <div key={ticket.id} className="p-5 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row gap-4 relative">
                  <div className="absolute top-4 left-4 w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">チケット名</label>
                      <input
                        type="text"
                        value={ticket.name}
                        onChange={e => handleUpdateTicket(ticket.id, 'name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="例：大人、VIP席"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">料金 (円)</label>
                      <input
                        type="number"
                        min="0"
                        value={ticket.price}
                        onChange={e => handleUpdateTicket(ticket.id, 'price', Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">説明 (任意)</label>
                      <input
                        type="text"
                        value={ticket.desc}
                        onChange={e => handleUpdateTicket(ticket.id, 'desc', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="例：18歳以上、1ドリンク付き"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end sm:items-start pt-2">
                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors flex items-center text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> 削除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddTicket}
              className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 flex items-center justify-center font-bold transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" /> 新しいチケットを追加
            </button>
          </div>
        )}

        {/* --- タブ3: 人数設定 --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="p-6 border border-gray-200 rounded-xl bg-white">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" /> 1予約あたりの人数制限
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                1回の予約でユーザーが選択できる合計最大人数を設定します。
              </p>
              
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大人数
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxPeople}
                    onChange={e => setMaxPeople(Number(e.target.value))}
                    className="block w-24 p-2 text-center border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-lg font-bold outline-none"
                  />
                  <span className="ml-3 text-gray-700 font-medium">名まで</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg flex items-start">
              <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                設定は自動的に保存され、すぐにユーザー画面に反映されます。ヘッダーの「ユーザー画面へ戻る」ボタンから実際の動作を確認できます。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}