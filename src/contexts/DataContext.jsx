import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { dataReducer, initialState } from '../reducers/dataReducer'
import { loadData, saveData } from '../utils/storage'

const DataContext = createContext()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = loadData()
    if (savedData) {
      dispatch({ type: 'LOAD_DATA', payload: savedData })
    }
  }, [])

  // Save data to localStorage whenever state changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveData(state)
    }, 1000) // Debounce saves by 1 second

    return () => clearTimeout(timeoutId)
  }, [state])

  const value = {
    state,
    dispatch,
    // Helper functions
    addArticle: (article) => dispatch({ type: 'ADD_ARTICLE', payload: article }),
    deleteArticle: (articleId) => dispatch({ type: 'DELETE_ARTICLE', payload: articleId }),
    addStar: (star) => dispatch({ type: 'ADD_STAR', payload: star }),
    deleteStar: (starId) => dispatch({ type: 'DELETE_STAR', payload: starId }),
    updateStar: (starId, updates) => dispatch({ type: 'UPDATE_STAR', payload: { starId, updates } }),
    addTag: (tag) => dispatch({ type: 'ADD_TAG', payload: tag }),
    setSelectedTags: (tags) => dispatch({ type: 'SET_SELECTED_TAGS', payload: tags }),
    addMemoryCapsule: (capsule) => dispatch({ type: 'ADD_MEMORY_CAPSULE', payload: capsule }),
    updateMemoryCapsule: (capsuleId, updates) => dispatch({ type: 'UPDATE_MEMORY_CAPSULE', payload: { capsuleId, updates } }),
    setDailyLight: (star) => dispatch({ type: 'SET_DAILY_LIGHT', payload: star }),
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}
