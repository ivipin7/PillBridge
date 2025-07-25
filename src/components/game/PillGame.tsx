import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Gamepad2, Trophy, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

interface PillGameProps {
  medications: any[];
}

export function PillGame({ medications }: PillGameProps) {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    if (user) {
      fetchBestScore();
    }
  }, [user]);

  const fetchBestScore = async () => {
    try {
      const res = await fetch(`${API_BASE}/game_scores?patient_id=${user._id}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setBestScore(data[0].score);
      }
    } catch (error) {
      // No scores yet
    }
  };

  const generateQuestions = () => {
    if (medications.length < 2) return [];

    const gameQuestions = [];
    const questionCount = Math.min(5, medications.length);

    for (let i = 0; i < questionCount; i++) {
      const correctMed = medications[i];
      const otherMeds = medications.filter(med => med.id !== correctMed.id);
      const wrongAnswers = otherMeds
        .sort(() => 0.5 - Math.random())
        .slice(0, 2)
        .map(med => med.name);

      const answers = [correctMed.name, ...wrongAnswers]
        .sort(() => 0.5 - Math.random());

      gameQuestions.push({
        medication: correctMed,
        answers: answers,
        correctAnswer: correctMed.name,
      });
    }

    return gameQuestions;
  };

  const startGame = () => {
    const newQuestions = generateQuestions();
    if (newQuestions.length === 0) return;

    setQuestions(newQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setGameState('playing');
    setShowResult(false);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setTimeout(() => {
      const isCorrect = answer === questions[currentQuestion].correctAnswer;
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
      setShowResult(true);
      setTimeout(() => {
        if (currentQuestion + 1 < questions.length) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
          setShowResult(false);
        } else {
          finishGame();
        }
      }, 1500);
    }, 500);
  };

  const finishGame = async () => {
    setGameState('finished');
    try {
      const finalScore = score + (selectedAnswer === questions[currentQuestion]?.correctAnswer ? 1 : 0);
      const res = await fetch(`${API_BASE}/game_scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user._id,
          score: finalScore,
          total_questions: questions.length,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      if (!res.ok) throw new Error('Failed to save game score');
      if (finalScore > bestScore) {
        setBestScore(finalScore);
      }
    } catch (error) {
      console.error('Error saving game score:', error);
    }
  };

  if (medications.length < 2) {
    return (
      <div className="text-center py-12">
        <Gamepad2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Not Ready Yet</h3>
        <p className="text-gray-600">
          Add at least 2 medications with photos to play the Pill Recognition Game
        </p>
      </div>
    );
  }

  if (gameState === 'menu') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Gamepad2 className="h-10 w-10 text-purple-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Pill Recognition Challenge</h2>
        <p className="text-lg text-gray-600 mb-8">
          Test your knowledge by matching medication names to their photos. 
          This helps reinforce your medication recognition skills!
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium">Best Score</p>
              <p className="text-2xl font-bold text-gray-900">{bestScore}</p>
            </div>
            
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium">Available Medications</p>
              <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
            </div>
          </div>
        </div>

        <button
          onClick={startGame}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xl font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
        >
          Start Game
        </button>
      </div>
    );
  }

  if (gameState === 'playing') {
    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correctAnswer;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Question {currentQuestion + 1} of {questions.length}
            </h2>
            <div className="text-right">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-xl font-bold text-blue-600">{score}/{questions.length}</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Which medication is this?
            </h3>
            
            <div className="w-64 h-64 mx-auto mb-6 bg-gray-100 rounded-xl overflow-hidden">
              {question.medication.image_url ? (
                <img
                  src={question.medication.image_url}
                  alt="Medication"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Gamepad2 className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-gray-600">No image available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {question.answers.map((answer: string, index: number) => {
              let buttonClass = "w-full p-4 text-lg font-medium rounded-lg border-2 transition-all duration-200 ";
              
              if (showResult && selectedAnswer) {
                if (answer === question.correctAnswer) {
                  buttonClass += "border-green-500 bg-green-50 text-green-700";
                } else if (answer === selectedAnswer && answer !== question.correctAnswer) {
                  buttonClass += "border-red-500 bg-red-50 text-red-700";
                } else {
                  buttonClass += "border-gray-200 bg-gray-50 text-gray-500";
                }
              } else if (selectedAnswer === answer) {
                buttonClass += "border-blue-500 bg-blue-50 text-blue-700";
              } else {
                buttonClass += "border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700";
              }

              return (
                <button
                  key={index}
                  onClick={() => !selectedAnswer && handleAnswerSelect(answer)}
                  disabled={!!selectedAnswer}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <span>{answer}</span>
                    {showResult && answer === question.correctAnswer && (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                    {showResult && answer === selectedAnswer && answer !== question.correctAnswer && (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const finalScore = score;
    const percentage = (finalScore / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Game Complete!</h2>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 font-medium">Your Score</p>
                <p className="text-3xl font-bold text-blue-600">{finalScore}/{questions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Percentage</p>
                <p className="text-3xl font-bold text-green-600">{percentage.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {finalScore > bestScore && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 font-semibold">🎉 New Best Score!</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={() => setGameState('menu')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Back to Menu
            </button>
            <button
              onClick={startGame}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}