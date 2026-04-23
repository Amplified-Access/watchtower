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

// GetPublicDatasets godoc
//
//	@Summary		List public datasets
//	@Description	Returns a paginated list of publicly available datasets, optionally filtered by category
//	@Tags			Datasets
//	@Produce		json
//	@Param			limit		query		int		false	"Page size (default 20, max 100)"
//	@Param			offset		query		int		false	"Pagination offset"
//	@Param			search		query		string	false	"Search term"
//	@Param			sort		query		string	false	"Sort field (default: created_at)"
//	@Param			sortOrder	query		string	false	"Sort direction: asc or desc"
//	@Param			category	query		string	false	"Filter by category"
//	@Success		200			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/datasets [get]
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

// GetDatasetByID godoc
//
//	@Summary		Get dataset by ID
//	@Description	Returns a single public dataset by its UUID
//	@Tags			Datasets
//	@Produce		json
//	@Param			id	path		string	true	"Dataset UUID"
//	@Success		200	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/datasets/{id} [get]
func (h *DatasetHandler) GetDatasetByID(c *gin.Context) {
	id := c.Param("id")
	dataset, err := h.uc.GetDatasetByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, dataset)
}

// GetCategories godoc
//
//	@Summary		List dataset categories
//	@Description	Returns all distinct dataset categories
//	@Tags			Datasets
//	@Produce		json
//	@Success		200	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/datasets/categories [get]
func (h *DatasetHandler) GetCategories(c *gin.Context) {
	categories, err := h.uc.GetCategories(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, categories)
}

// IncrementDownload godoc
//
//	@Summary		Record dataset download
//	@Description	Increments the download counter for a dataset
//	@Tags			Datasets
//	@Produce		json
//	@Param			id	path		string	true	"Dataset UUID"
//	@Success		200	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/datasets/{id}/download [post]
func (h *DatasetHandler) IncrementDownload(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.IncrementDownload(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "download recorded"})
}

// GetAllDatasets godoc
//
//	@Summary		List all datasets
//	@Description	Returns a paginated list of all datasets regardless of visibility (super admin only)
//	@Tags			Super Admin – Datasets
//	@Produce		json
//	@Security		BearerAuth
//	@Param			limit		query		int		false	"Page size (default 20, max 100)"
//	@Param			offset		query		int		false	"Pagination offset"
//	@Param			search		query		string	false	"Search term"
//	@Param			sort		query		string	false	"Sort field"
//	@Param			sortOrder	query		string	false	"Sort direction: asc or desc"
//	@Success		200			{object}	presenter.Response
//	@Failure		401			{object}	presenter.Response
//	@Failure		403			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/superadmin/datasets [get]
func (h *DatasetHandler) GetAllDatasets(c *gin.Context) {
	params := parseListParams(c)
	datasets, total, err := h.uc.GetAllDatasets(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, datasets, total)
}

// CreateDataset godoc
//
//	@Summary		Create dataset
//	@Description	Creates a new dataset record (super admin only)
//	@Tags			Super Admin – Datasets
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		object{title=string,description=string,category=string,fileKey=string,fileName=string,fileSize=int,fileType=string,format=string,tags=[]string,keywords=[]string,source=string,license=string,coverage=string,methodology=string,isPublic=bool}	true	"Dataset payload"
//	@Success		201		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/superadmin/datasets [post]
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

// DeleteDataset godoc
//
//	@Summary		Delete dataset
//	@Description	Permanently removes a dataset (super admin only)
//	@Tags			Super Admin – Datasets
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Dataset UUID"
//	@Success		204
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/superadmin/datasets/{id} [delete]
func (h *DatasetHandler) DeleteDataset(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.DeleteDataset(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.NoContent(c)
}
