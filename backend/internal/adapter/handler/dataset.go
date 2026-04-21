package handler

import (
	"github.com/gin-gonic/gin"

	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	datasetusecase "backend/internal/usecase/dataset"
)

type DatasetHandler struct {
	uc *datasetusecase.UseCase
}

func NewDatasetHandler(uc *datasetusecase.UseCase) *DatasetHandler {
	return &DatasetHandler{uc: uc}
}

func (h *DatasetHandler) GetPublicDatasets(c *gin.Context) {
	params := parseListParams(c)
	category := c.Query("category")
	var categoryPtr *string
	if category != "" {
		categoryPtr = &category
	}
	datasets, total, err := h.uc.GetPublicDatasets(c.Request.Context(), params, categoryPtr)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, datasets, total)
}

func (h *DatasetHandler) GetDatasetByID(c *gin.Context) {
	id := c.Param("id")
	dataset, err := h.uc.GetDatasetByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, dataset)
}

func (h *DatasetHandler) GetCategories(c *gin.Context) {
	categories, err := h.uc.GetCategories(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, categories)
}

func (h *DatasetHandler) IncrementDownload(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.IncrementDownload(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "download recorded"})
}

func (h *DatasetHandler) GetAllDatasets(c *gin.Context) {
	params := parseListParams(c)
	datasets, total, err := h.uc.GetAllDatasets(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, datasets, total)
}

func (h *DatasetHandler) CreateDataset(c *gin.Context) {
	var input struct {
		Title       string   `json:"title" binding:"required"`
		Description string   `json:"description" binding:"required"`
		Category    string   `json:"category" binding:"required"`
		FileKey     string   `json:"fileKey" binding:"required"`
		FileName    string   `json:"fileName" binding:"required"`
		FileSize    int      `json:"fileSize" binding:"required"`
		FileType    string   `json:"fileType" binding:"required"`
		Format      string   `json:"format" binding:"required"`
		Tags        []string `json:"tags"`
		Keywords    []string `json:"keywords"`
		Source      *string  `json:"source"`
		License     string   `json:"license"`
		Coverage    *string  `json:"coverage"`
		Methodology *string  `json:"methodology"`
		IsPublic    bool     `json:"isPublic"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	if input.License == "" {
		input.License = "CC BY 4.0"
	}
	dataset := &entity.Dataset{
		Title:       input.Title,
		Description: input.Description,
		Category:    input.Category,
		FileKey:     input.FileKey,
		FileName:    input.FileName,
		FileSize:    input.FileSize,
		FileType:    input.FileType,
		Format:      input.Format,
		Tags:        input.Tags,
		Keywords:    input.Keywords,
		Source:      input.Source,
		License:     input.License,
		Coverage:    input.Coverage,
		Methodology: input.Methodology,
		IsPublic:    input.IsPublic,
		Version:     "1.0",
	}
	if err := h.uc.CreateDataset(c.Request.Context(), dataset); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, dataset)
}

func (h *DatasetHandler) DeleteDataset(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.DeleteDataset(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.NoContent(c)
}
