import { generateId } from '../utils/helpers'

export const initialState = {
  articles: {},
  stars: {},
  tags: [],
  selectedTags: [],
  memoryCapsules: {},
  dailyLight: null,
  lastDailyLightDate: null,
  aiSummaries: {},
  version: '1.0.0'
}

export const dataReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...initialState,
        ...action.payload
      }

    case 'ADD_ARTICLE':
      const articleId = action.payload.id || generateId()
      return {
        ...state,
        articles: {
          ...state.articles,
          [articleId]: {
            ...action.payload,
            id: articleId,
            createdAt: new Date().toISOString(),
          }
        }
      }

    case 'DELETE_ARTICLE':
      const { [action.payload]: deletedArticle, ...remainingArticles } = state.articles
      // Also delete all stars associated with this article
      const remainingStars = Object.fromEntries(
        Object.entries(state.stars).filter(([_, star]) => star.articleId !== action.payload)
      )
      return {
        ...state,
        articles: remainingArticles,
        stars: remainingStars,
      }

    case 'ADD_STAR':
      const newStarId = action.payload.id || generateId()
      return {
        ...state,
        stars: {
          ...state.stars,
          [newStarId]: {
            ...action.payload,
            id: newStarId,
            createdAt: new Date().toISOString(),
          }
        }
      }

    case 'DELETE_STAR':
      const { [action.payload]: deletedStar, ...remainingStarsAfterDelete } = state.stars
      return {
        ...state,
        stars: remainingStarsAfterDelete,
      }

    case 'UPDATE_STAR':
      const { starId: updateStarId, updates } = action.payload
      return {
        ...state,
        stars: {
          ...state.stars,
          [updateStarId]: {
            ...state.stars[updateStarId],
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        }
      }

    case 'ADD_TAG':
      if (!state.tags.includes(action.payload)) {
        return {
          ...state,
          tags: [...state.tags, action.payload]
        }
      }
      return state

    case 'SET_SELECTED_TAGS':
      return {
        ...state,
        selectedTags: action.payload
      }

    case 'ADD_MEMORY_CAPSULE':
      const capsuleId = action.payload.id || generateId()
      return {
        ...state,
        memoryCapsules: {
          ...state.memoryCapsules,
          [capsuleId]: {
            ...action.payload,
            id: capsuleId,
            createdAt: new Date().toISOString(),
          }
        }
      }

    case 'UPDATE_MEMORY_CAPSULE':
      const { capsuleId: updateCapsuleId, updates: capsuleUpdates } = action.payload
      return {
        ...state,
        memoryCapsules: {
          ...state.memoryCapsules,
          [updateCapsuleId]: {
            ...state.memoryCapsules[updateCapsuleId],
            ...capsuleUpdates,
            updatedAt: new Date().toISOString(),
          }
        }
      }

    case 'SET_DAILY_LIGHT':
      return {
        ...state,
        dailyLight: action.payload,
        lastDailyLightDate: new Date().toISOString(),
      }

    default:
      return state
  }
}
