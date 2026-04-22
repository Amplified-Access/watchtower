package handler

import (
	"github.com/gin-gonic/gin"

	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	alertusecase "backend/internal/usecase/alert"
)

type AlertHandler struct {
	uc *alertusecase.UseCase
}

func NewAlertHandler(uc *alertusecase.UseCase) *AlertHandler {
	return &AlertHandler{uc: uc}
}

func (h *AlertHandler) Create(c *gin.Context) {
	var input struct {
		Email              string                     `json:"email" binding:"required,email"`
		Name               *string                    `json:"name"`
		Phone              *string                    `json:"phone"`
		IncidentTypes      []string                   `json:"incidentTypes" binding:"required"`
		Locations          []entity.LocationPreference `json:"locations" binding:"required"`
		SeverityLevels     []string                   `json:"severityLevels" binding:"required"`
		EmailNotifications bool                       `json:"emailNotifications"`
		SMSNotifications   bool                       `json:"smsNotifications"`
		AlertFrequency     entity.AlertFrequency      `json:"alertFrequency"`
		Timezone           string                     `json:"timezone"`
		PreferredLanguage  string                     `json:"preferredLanguage"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	if input.AlertFrequency == "" {
		input.AlertFrequency = entity.FrequencyImmediate
	}
	if input.Timezone == "" {
		input.Timezone = "UTC"
	}
	if input.PreferredLanguage == "" {
		input.PreferredLanguage = "en"
	}
	sub := &entity.AlertSubscription{
		Email:             input.Email,
		Name:              input.Name,
		Phone:             input.Phone,
		IncidentTypes:     input.IncidentTypes,
		Locations:         input.Locations,
		SeverityLevels:    input.SeverityLevels,
		EmailNotifications: input.EmailNotifications,
		SMSNotifications:  input.SMSNotifications,
		AlertFrequency:    input.AlertFrequency,
		Timezone:          input.Timezone,
		PreferredLanguage: input.PreferredLanguage,
		IsActive:          true,
	}
	if err := h.uc.Create(c.Request.Context(), sub); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, sub)
}

func (h *AlertHandler) GetByEmail(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		presenter.BadRequest(c, "email query parameter required")
		return
	}
	subs, err := h.uc.GetByEmail(c.Request.Context(), email)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, subs)
}

func (h *AlertHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Name               *string                    `json:"name"`
		Phone              *string                    `json:"phone"`
		IncidentTypes      []string                   `json:"incidentTypes"`
		Locations          []entity.LocationPreference `json:"locations"`
		SeverityLevels     []string                   `json:"severityLevels"`
		EmailNotifications *bool                      `json:"emailNotifications"`
		SMSNotifications   *bool                      `json:"smsNotifications"`
		AlertFrequency     entity.AlertFrequency      `json:"alertFrequency"`
		Timezone           string                     `json:"timezone"`
		PreferredLanguage  string                     `json:"preferredLanguage"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	// In a real app, we'd fetch the existing sub first or have a specific Update repo method
	sub := &entity.AlertSubscription{
		ID: id,
	}
	if input.Name != nil {
		sub.Name = input.Name
	}
	if input.Phone != nil {
		sub.Phone = input.Phone
	}
	if input.IncidentTypes != nil {
		sub.IncidentTypes = input.IncidentTypes
	}
	if input.Locations != nil {
		sub.Locations = input.Locations
	}
	if input.SeverityLevels != nil {
		sub.SeverityLevels = input.SeverityLevels
	}
	if input.EmailNotifications != nil {
		sub.EmailNotifications = *input.EmailNotifications
	}
	if input.SMSNotifications != nil {
		sub.SMSNotifications = *input.SMSNotifications
	}
	if input.AlertFrequency != "" {
		sub.AlertFrequency = input.AlertFrequency
	}
	if input.Timezone != "" {
		sub.Timezone = input.Timezone
	}
	if input.PreferredLanguage != "" {
		sub.PreferredLanguage = input.PreferredLanguage
	}

	if err := h.uc.Update(c.Request.Context(), sub); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, sub)
}

func (h *AlertHandler) GetAllActive(c *gin.Context) {
	subs, err := h.uc.GetAllActive(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, subs)
}

func (h *AlertHandler) GetStats(c *gin.Context) {
	stats, err := h.uc.GetStats(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, stats)
}

func (h *AlertHandler) Deactivate(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.Deactivate(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "subscription deactivated"})
}

func (h *AlertHandler) Activate(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.Activate(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "subscription activated"})
}
