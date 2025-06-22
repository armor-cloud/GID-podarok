from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class UTMParameter(BaseModel):
    key: str
    value: str

class PopupConfig(BaseModel):
    imageUrl: Optional[str] = Field(None, alias='imageUrl')
    title: Optional[str] = None
    description: Optional[str] = None
    subtitle: Optional[str] = None
    benefits: Optional[List[str]] = None
    activation_steps: Optional[List[str]] = None
    terms_link_text: Optional[str] = None
    terms_link_url: Optional[str] = None
    legal_info: Optional[str] = None
    offer_validity: Optional[str] = None
    updated_at_text: Optional[str] = None
    share_button_enabled: bool = False

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class TaskBase(BaseModel):
    title: str
    description: str
    points: int
    is_visible: bool = True
    expires_at: Optional[datetime] = None
    details: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    title: Optional[str] = None
    description: Optional[str] = None
    points: Optional[int] = None
    is_visible: Optional[bool] = None
    is_completed: Optional[bool] = None
    expires_at: Optional[datetime] = None
    details: Optional[str] = None

class Task(TaskBase):
    id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# BKLG-1: Schemas for PromoCode
class PromoCodeBase(BaseModel):
    code: str

class PromoCodeCreate(PromoCodeBase):
    pass

class PromoCode(PromoCodeBase):
    id: int
    is_used: bool
    used_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# BKLG-1: Schemas for EmailLead
class EmailLeadBase(BaseModel):
    email: str
    gift_id: int

class EmailLeadCreate(EmailLeadBase):
    pass

class EmailLead(EmailLeadBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

# BKLG-1: Schemas for Gift
class GiftBase(BaseModel):
    logo: str
    title: str
    description: str
    isHighlighted: bool = False
    isClaimed: bool = False
    isHit: bool = False
    redirect_url: Optional[str] = None
    action_type: str = 'redirect'
    popup_config: Optional[PopupConfig] = None
    utm_config: Optional[List[UTMParameter]] = None

class GiftCreate(GiftBase):
    pass

class GiftUpdate(BaseModel):
    logo: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    isHighlighted: Optional[bool] = None
    isClaimed: Optional[bool] = None
    isHit: Optional[bool] = None
    redirect_url: Optional[str] = None
    action_type: Optional[str] = None
    popup_config: Optional[PopupConfig] = None
    utm_config: Optional[List[UTMParameter]] = None

class GiftOut(GiftBase):
    id: int
    promo_codes_count: int = 0
    promo_codes: List[PromoCode] = []

    class Config:
        orm_mode = True

class SettingsBase(BaseModel):
    logo_url: Optional[str] = None
    offer_text: Optional[str] = None
    showTimer: Optional[bool] = None
    timerTitle: Optional[str] = None
    showWheel: Optional[bool] = None
    showTasks: Optional[bool] = None
    showFooter: Optional[bool] = None

class SettingsUpdate(SettingsBase):
    pass

class SettingsOut(SettingsBase):
    id: int
    class Config:
        orm_mode = True 