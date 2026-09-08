from abc import ABC, abstractmethod

class MovieDataProvider(ABC):
    
    @abstractmethod
    async def search_movies(self, query: str, page: int, language: str) -> dict:
        pass
        
    @abstractmethod
    async def search_series(self, query: str, page: int, language: str) -> dict:
        pass
        
    @abstractmethod
    async def get_movie_details(self, movie_id: int) -> dict:
        pass
        
    @abstractmethod
    async def get_series_details(self, series_id: int) -> dict:
        pass
        
    @abstractmethod
    async def get_trending(self, media_type: str, time_window: str) -> dict:
        pass
        
    @abstractmethod
    async def get_popular(self, media_type: str, page: int) -> dict:
        pass
        
    @abstractmethod
    async def get_genres(self, media_type: str) -> list:
        pass
        
    @abstractmethod
    async def discover(self, media_type: str, **filters) -> dict:
        pass
