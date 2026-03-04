import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, DollarSign, Users, Heart, Plus, ChevronLeft, Search, Filter, User, Settings, BookmarkIcon } from 'lucide-react';
import { eventAPI, userAPI, analyticsAPI } from './api';

const App = () => {
  const [currentPage, setCurrentPage] = useState('feed');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [savedEvents, setSavedEvents] = useState([]);
  const [rsvpEvents, setRsvpEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    date: 'all',
    category: 'all',
    price: 'all',
    location: 'Campus Center',
    radius: 5
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userProfile, setUserProfile] = useState({
    name: 'Alex Chen',
    username: '@alexc',
    school: 'State University',
    year: 'Junior',
    interests: ['Music', 'Sports', 'Community'],
    bio: 'Always down for live music and pickup sports 🎵⚽',
    eventsAttended: 0,
    eventsSaved: 0
  });
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user and load data
  useEffect(() => {
    initializeUser();
    loadEvents();
  }, []);

  // Track page views
  useEffect(() => {
    const startTime = Date.now();
    
    if (userId) {
      analyticsAPI.trackPageView(userId, currentPage, 0);
    }
    
    return () => {
      if (userId) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        analyticsAPI.trackPageView(userId, currentPage, duration);
      }
    };
  }, [currentPage, userId]);

  const initializeUser = async () => {
    try {
      // Check if user exists in localStorage
      let storedUserId = localStorage.getItem('converge_user_id');
      
      if (!storedUserId) {
        // Create default user
        const response = await userAPI.createUser({
          username: 'alexc',
          name: 'Alex Chen',
          email: 'alex@example.com',
          school: 'State University',
          year: 'Junior',
          bio: 'Always down for live music and pickup sports 🎵⚽',
          interests: ['Music', 'Sports', 'Community']
        });
        storedUserId = response.data.id;
        localStorage.setItem('converge_user_id', storedUserId);
      }
      
      setUserId(storedUserId);
      
      // Load user profile
      const userResponse = await userAPI.getUser(storedUserId);
      setUserProfile(userResponse.data);
      
      // Load user's RSVPs and saves
      const rsvpsResponse = await userAPI.getUserRSVPs(storedUserId);
      const savedResponse = await userAPI.getUserSaved(storedUserId);
      
      setRsvpEvents(rsvpsResponse.data.map(e => e.id));
      setSavedEvents(savedResponse.data.map(e => e.id));
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await eventAPI.getAllEvents();
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const categories = [
    { id: 'all', name: 'All', icon: '🎉' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'pop-up', name: 'Pop-ups', icon: '🛍️' },
    { id: 'community', name: 'Community', icon: '🤝' }
  ];

  const filterEvents = (events) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      if (filters.date === 'today' && eventDate.toDateString() !== today.toDateString()) return false;
      if (filters.date === 'weekend') {
        const day = eventDate.getDay();
        if (day !== 0 && day !== 6) return false;
      }
      if (filters.date === 'week' && eventDate > weekEnd) return false;

      if (filters.category !== 'all' && event.category !== filters.category) return false;

      if (filters.price === 'free' && event.price !== 0) return false;
      if (filters.price === 'under10' && event.price > 10) return false;
      if (filters.price === 'under20' && event.price > 20) return false;

      if (event.distance_from_campus > filters.radius) return false;

      return true;
    });
  };

  const toggleSave = async (eventId) => {
    const isSaved = savedEvents.includes(eventId);
    
    try {
      if (isSaved) {
        await eventAPI.unsaveEvent(eventId, userId);
        setSavedEvents(prev => prev.filter(id => id !== eventId));
      } else {
        await eventAPI.saveEvent(eventId, userId);
        setSavedEvents(prev => [...prev, eventId]);
      }
      
      analyticsAPI.trackInteraction(userId, eventId, isSaved ? 'unsave' : 'save', currentPage);
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const toggleRsvp = async (eventId) => {
    const isRsvped = rsvpEvents.includes(eventId);
    
    try {
      if (isRsvped) {
        await eventAPI.unRsvpEvent(eventId, userId);
        setRsvpEvents(prev => prev.filter(id => id !== eventId));
      } else {
        await eventAPI.rsvpEvent(eventId, userId);
        setRsvpEvents(prev => [...prev, eventId]);
      }
      
      analyticsAPI.trackInteraction(userId, eventId, isRsvped ? 'un_rsvp' : 'rsvp', currentPage);
    } catch (error) {
      console.error('Error toggling RSVP:', error);
    }
  };

  const handleFilterChange = (filterType, filterValue) => {
    setFilters({ ...filters, [filterType]: filterValue });
    
    if (userId) {
      analyticsAPI.trackFilter(userId, filterType, filterValue);
    }
  };

  const filteredEvents = filterEvents(events);

  // Navigation Bar
  const NavBar = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <button 
          onClick={() => setCurrentPage('feed')}
          className={`flex flex-col items-center justify-center flex-1 ${currentPage === 'feed' ? 'text-[#FF715B]' : 'text-gray-400'}`}
        >
          <Search size={24} />
          <span className="text-xs mt-1">Discover</span>
        </button>
        <button 
          onClick={() => setCurrentPage('calendar')}
          className={`flex flex-col items-center justify-center flex-1 ${currentPage === 'calendar' ? 'text-[#FF715B]' : 'text-gray-400'}`}
        >
          <Calendar size={24} />
          <span className="text-xs mt-1">Calendar</span>
        </button>
        <button 
          onClick={() => setCurrentPage('submit')}
          className={`flex flex-col items-center justify-center flex-1 ${currentPage === 'submit' ? 'text-[#FF715B]' : 'text-gray-400'}`}
        >
          <Plus size={24} />
          <span className="text-xs mt-1">Add Event</span>
        </button>
        <button 
          onClick={() => setCurrentPage('profile')}
          className={`flex flex-col items-center justify-center flex-1 ${currentPage === 'profile' ? 'text-[#FF715B]' : 'text-gray-400'}`}
        >
          <User size={24} />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );

  // Event Feed Page
  const EventFeed = () => (
    <div className="pb-20">
      <div className="sticky top-0 bg-white z-40 border-b border-gray-200">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-[#0F4057]">Converge</h1>
          <p className="text-sm text-gray-500">Find things to do near campus</p>
        </div>
        
        <div className="px-4 pb-3 overflow-x-auto flex gap-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleFilterChange('category', cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                filters.category === cat.id 
                  ? 'bg-[#FF715B] text-white' 
                  : 'bg-[#FEFADC] text-[#0F4057] hover:bg-[#FEF5CD]'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FEFADC] rounded-full text-sm font-medium text-[#0F4057] hover:bg-[#FEF5CD]"
          >
            <Filter size={16} />
            Filters
            {(filters.date !== 'all' || filters.price !== 'all' || filters.radius < 5) && (
              <span className="w-2 h-2 bg-[#FF715B] rounded-full"></span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
            <div className="py-3">
              <label className="text-sm font-medium text-gray-700 mb-2 block">When</label>
              <div className="flex gap-2 flex-wrap">
                {['all', 'today', 'weekend', 'week'].map(date => (
                  <button
                    key={date}
                    onClick={() => handleFilterChange('date', date)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      filters.date === date 
                        ? 'bg-[#FF715B] text-white' 
                        : 'bg-white text-[#0F4057] border border-gray-300'
                    }`}
                  >
                    {date === 'all' ? 'Any time' : date === 'today' ? 'Today' : date === 'weekend' ? 'This weekend' : 'This week'}
                  </button>
                ))}
              </div>
            </div>
            <div className="py-3">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Price</label>
              <div className="flex gap-2 flex-wrap">
                {['all', 'free', 'under10', 'under20'].map(price => (
                  <button
                    key={price}
                    onClick={() => handleFilterChange('price', price)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      filters.price === price 
                        ? 'bg-[#FF715B] text-white' 
                        : 'bg-white text-[#0F4057] border border-gray-300'
                    }`}
                  >
                    {price === 'all' ? 'Any price' : price === 'free' ? 'Free' : price === 'under10' ? 'Under $10' : 'Under $20'}
                  </button>
                ))}
              </div>
            </div>
            <div className="py-3">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                placeholder="e.g., Campus Center, Downtown"
              />
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Radius: {filters.radius} {filters.radius === 1 ? 'mile' : 'miles'}
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={filters.radius}
                onChange={(e) => handleFilterChange('radius', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF715B]"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5 mi</span>
                <span>5 mi</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No events match your filters</p>
            <button 
              onClick={() => setFilters({ date: 'all', category: 'all', price: 'all', location: 'Campus Center', radius: 5 })}
              className="mt-2 text-[#FF715B] font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div 
              key={event.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-1 bg-[#FF715B] bg-opacity-20 text-[#FF715B] rounded-full">
                        {categories.find(c => c.id === event.category)?.name}
                      </span>
                      {event.price === 0 && (
                        <span className="text-xs font-medium px-2 py-1 bg-[#FEFADC] text-[#0F4057] rounded-full border border-[#0F4057]">
                          Free
                        </span>
                      )}
                    </div>
                    <h3 
                      onClick={() => {
                        setSelectedEvent(event);
                        setCurrentPage('detail');
                        if (userId) {
                          analyticsAPI.trackInteraction(userId, event.id, 'view_detail', 'feed');
                        }
                      }}
                      className="text-lg font-bold text-gray-900 cursor-pointer hover:text-[#FF715B]"
                    >
                      {event.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => toggleSave(event.id)}
                    className={`p-2 rounded-full ${savedEvents.includes(event.id) ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    <Heart size={20} fill={savedEvents.includes(event.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span>{event.location} • {event.distance_from_campus} mi</span>
                  </div>
                  {event.price > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign size={16} />
                      <span>${event.price}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users size={16} />
                    <span>{event.rsvp_count || 0} going</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setCurrentPage('detail');
                      if (userId) {
                        analyticsAPI.trackInteraction(userId, event.id, 'view_detail', 'feed');
                      }
                    }}
                    className="px-4 py-2 bg-[#FF715B] text-white rounded-full text-sm font-medium hover:bg-[#FF6048] transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Calendar Page (simplified for brevity - keeping same structure as before)
  const CalendarPage = () => (
    <div className="pb-20">
      <div className="sticky top-0 bg-white z-40 border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
      </div>
      <div className="p-4 text-center py-12">
        <p className="text-gray-500">Calendar view - coming soon!</p>
      </div>
    </div>
  );

  // Event Detail Page
  const EventDetail = () => {
    if (!selectedEvent) return null;

    return (
      <div className="pb-20">
        <div className="sticky top-0 bg-white z-40 border-b border-gray-200 p-4">
          <button
            onClick={() => setCurrentPage('feed')}
            className="flex items-center gap-2 text-[#FF715B] font-medium"
          >
            <ChevronLeft size={20} />
            Back
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium px-3 py-1 bg-[#FF715B] bg-opacity-20 text-[#FF715B] rounded-full">
                {categories.find(c => c.id === selectedEvent.category)?.name}
              </span>
              {selectedEvent.price === 0 && (
                <span className="text-xs font-medium px-3 py-1 bg-[#FEFADC] text-[#0F4057] rounded-full border border-[#0F4057]">
                  Free
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedEvent.name}</h1>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-gray-600">{selectedEvent.time}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">{selectedEvent.location}</div>
                  <div className="text-gray-600">{selectedEvent.distance_from_campus} mi from campus</div>
                </div>
              </div>

              {selectedEvent.price > 0 && (
                <div className="flex items-start gap-3">
                  <DollarSign size={20} className="text-gray-400 mt-0.5" />
                  <div className="font-medium text-gray-900">${selectedEvent.price}</div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">About</h2>
              <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Who's Going</h2>
                <span className="text-sm text-gray-500">{selectedEvent.rsvp_count || 0} people</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3 max-w-md mx-auto">
            <button
              onClick={() => toggleSave(selectedEvent.id)}
              className={`flex-1 py-3 rounded-full font-medium transition-colors ${
                savedEvents.includes(selectedEvent.id)
                  ? 'bg-gray-100 text-gray-700'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {savedEvents.includes(selectedEvent.id) ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => toggleRsvp(selectedEvent.id)}
              className={`flex-1 py-3 rounded-full font-medium transition-colors ${
                rsvpEvents.includes(selectedEvent.id)
                  ? 'bg-[#0F4057] text-white'
                  : 'bg-[#FF715B] text-white hover:bg-[#FF6048]'
              }`}
            >
              {rsvpEvents.includes(selectedEvent.id) ? "I'm Going!" : 'RSVP'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Submit Event Page
  const SubmitEvent = () => {
    const [formData, setFormData] = useState({
      name: '',
      category: 'music',
      date: '',
      time: '',
      location: '',
      price: '',
      description: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        await eventAPI.createEvent({
          ...formData,
          price: parseFloat(formData.price) || 0,
          distanceFromCampus: 0.5,
          userId: userId
        });
        
        analyticsAPI.trackInteraction(userId, null, 'create_event', 'submit', { category: formData.category });
        
        alert('Event submitted successfully!');
        setFormData({
          name: '',
          category: 'music',
          date: '',
          time: '',
          location: '',
          price: '',
          description: ''
        });
        
        // Reload events
        loadEvents();
      } catch (error) {
        console.error('Error submitting event:', error);
        alert('Failed to submit event. Please try again.');
      }
    };

    return (
      <div className="pb-20">
        <div className="sticky top-0 bg-white z-40 border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900">Add an Event</h1>
          <p className="text-sm text-gray-500">Share what's happening around campus</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF715B] focus:border-transparent"
              placeholder="e.g., Acoustic Night at The Cafe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF715B] focus:border-transparent"
            >
              <option value="music">Music</option>
              <option value="sports">Sports</option>
              <option value="pop-up">Pop-up</option>
              <option value="community">Community</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF715B] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF715B] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF715B] focus:border-transparent"
              placeholder="e.g., Student Union Room 204"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF715B] focus:border-transparent"
              placeholder="Leave blank if free"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF715B] focus:border-transparent"
              rows="4"
              placeholder="What should people know about this event?"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#FF715B] text-white rounded-full font-medium hover:bg-[#FF6048] transition-colors"
          >
            Submit Event
          </button>
        </form>
      </div>
    );
  };

  // Profile Page
  const ProfilePage = () => {
    const myEvents = events.filter(e => rsvpEvents.includes(e.id));
    const mySavedEvents = events.filter(e => savedEvents.includes(e.id));

    return (
      <div className="pb-20">
        <div className="sticky top-0 bg-white z-40 border-b border-gray-200">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-[#FEFADC] to-[#FEF5CD]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-[#FF715B] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {userProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
              <p className="text-gray-600">{userProfile.username}</p>
              <p className="text-sm text-gray-500">{userProfile.year} • {userProfile.school}</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">{userProfile.bio}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {userProfile.interests?.map(interest => (
              <span key={interest} className="px-3 py-1 bg-white text-[#FF715B] rounded-full text-sm font-medium border border-[#FF715B]">
                {interest}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#FF715B]">{userProfile.eventsAttended}</div>
              <div className="text-sm text-gray-600">Events Attended</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#FF715B]">{userProfile.eventsSaved}</div>
              <div className="text-sm text-gray-600">Events Saved</div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={20} />
            My Upcoming Events
          </h3>
          {myEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No events yet!</p>
              <button 
                onClick={() => setCurrentPage('feed')}
                className="mt-2 text-[#FF715B] font-medium"
              >
                Discover events
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {myEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event);
                    setCurrentPage('detail');
                  }}
                  className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900">{event.name}</h4>
                    <span className="text-xs font-medium px-2 py-1 bg-[#FF715B] bg-opacity-20 text-[#FF715B] rounded-full">
                      {categories.find(c => c.id === event.category)?.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock size={14} />
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {event.time}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <BookmarkIcon size={20} />
            Saved Events
          </h3>
          {mySavedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No saved events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mySavedEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event);
                    setCurrentPage('detail');
                  }}
                  className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900">{event.name}</h4>
                    <span className="text-xs font-medium px-2 py-1 bg-[#FF715B] bg-opacity-20 text-[#FF715B] rounded-full">
                      {categories.find(c => c.id === event.category)?.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock size={14} />
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {event.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      {currentPage === 'feed' && <EventFeed />}
      {currentPage === 'calendar' && <CalendarPage />}
      {currentPage === 'detail' && <EventDetail />}
      {currentPage === 'submit' && <SubmitEvent />}
      {currentPage === 'profile' && <ProfilePage />}
      <NavBar />
    </div>
  );
};

export default App;
