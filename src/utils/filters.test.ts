import { describe, expect, it } from 'vitest';

import { decodeFiltersFromParam, encodeFiltersToParam, redirectToPageWithParam } from './filters';

describe('filter utils', () => {
  describe('encodeFiltersToParam', () => {
    it('should encode single filter with single value', () => {
      const filters = { status: ['ACTIVE'] };
      expect(encodeFiltersToParam(filters)).toBe('status:ACTIVE');
    });

    it('should encode single filter with multiple values', () => {
      const filters = { status: ['ACTIVE', 'CLOSED', 'DRAFT'] };
      expect(encodeFiltersToParam(filters)).toBe('status:ACTIVE,CLOSED,DRAFT');
    });

    it('should encode multiple filters', () => {
      const filters = {
        status: ['ACTIVE', 'CLOSED'],
        travelId: ['id1', 'id2'],
      };
      const result = encodeFiltersToParam(filters);
      expect(result).toContain('status:ACTIVE,CLOSED');
      expect(result).toContain('travelId:id1,id2');
      expect(result.split('|')).toHaveLength(2);
    });

    it('should ignore empty values', () => {
      const filters = { status: ['ACTIVE', '', 'CLOSED'] };
      expect(encodeFiltersToParam(filters)).toBe('status:ACTIVE,CLOSED');
    });

    it('should ignore filters with empty arrays', () => {
      const filters = { status: ['ACTIVE'], empty: [] };
      expect(encodeFiltersToParam(filters)).toBe('status:ACTIVE');
    });

    it('should ignore filters with only empty strings', () => {
      const filters = { status: ['ACTIVE'], empty: ['', ''] };
      expect(encodeFiltersToParam(filters)).toBe('status:ACTIVE');
    });

    it('should return empty string for empty filters object', () => {
      expect(encodeFiltersToParam({})).toBe('');
    });
  });

  describe('decodeFiltersFromParam', () => {
    it('should decode single filter with single value', () => {
      const param = 'status:ACTIVE';
      expect(decodeFiltersFromParam(param)).toEqual({ status: ['ACTIVE'] });
    });

    it('should decode single filter with multiple values', () => {
      const param = 'status:ACTIVE,CLOSED,DRAFT';
      expect(decodeFiltersFromParam(param)).toEqual({ status: ['ACTIVE', 'CLOSED', 'DRAFT'] });
    });

    it('should decode multiple filters', () => {
      const param = 'status:ACTIVE,CLOSED|travelId:id1,id2';
      expect(decodeFiltersFromParam(param)).toEqual({
        status: ['ACTIVE', 'CLOSED'],
        travelId: ['id1', 'id2'],
      });
    });

    it('should handle whitespace in values', () => {
      const param = 'status: ACTIVE , CLOSED ';
      expect(decodeFiltersFromParam(param)).toEqual({ status: ['ACTIVE', 'CLOSED'] });
    });

    it('should handle whitespace in groups', () => {
      const param = ' status:ACTIVE | travelId:id1 ';
      expect(decodeFiltersFromParam(param)).toEqual({
        status: ['ACTIVE'],
        travelId: ['id1'],
      });
    });

    it('should ignore empty groups', () => {
      const param = 'status:ACTIVE||travelId:id1';
      expect(decodeFiltersFromParam(param)).toEqual({
        status: ['ACTIVE'],
        travelId: ['id1'],
      });
    });

    it('should ignore invalid groups (missing colon)', () => {
      const param = 'status:ACTIVE|invalid|travelId:id1';
      expect(decodeFiltersFromParam(param)).toEqual({
        status: ['ACTIVE'],
        travelId: ['id1'],
      });
    });

    it('should return empty object for null or undefined', () => {
      expect(decodeFiltersFromParam(null)).toEqual({});
      expect(decodeFiltersFromParam(undefined)).toEqual({});
      expect(decodeFiltersFromParam('')).toEqual({});
    });

    it('should be inverse of encodeFiltersToParam', () => {
      const filters = {
        status: ['ACTIVE', 'CLOSED'],
        travelId: ['id1', 'id2'],
      };
      const encoded = encodeFiltersToParam(filters);
      const decoded = decodeFiltersFromParam(encoded);
      expect(decoded).toEqual(filters);
    });

    it('should round-trip values containing the , : | delimiters (text filters)', () => {
      const filters = { name: ['Doe, John'], q: ['a:b|c'] };
      expect(decodeFiltersFromParam(encodeFiltersToParam(filters))).toEqual(filters);
    });
  });

  describe('redirectToPageWithParam', () => {
    it('should return base URL when no tableState is provided', () => {
      const result = redirectToPageWithParam('/test');
      expect(result).toBe('/test');
    });

    it('should add prefilter parameter', () => {
      const result = redirectToPageWithParam('/test', { prefilter: 'all' });
      expect(result).toBe('/test?dt_prefilter=all');
    });

    it('should add search parameter', () => {
      const result = redirectToPageWithParam('/test', { search: 'john' });
      expect(result).toBe('/test?dt_search=john');
    });

    it('should add pagination parameters', () => {
      const result = redirectToPageWithParam('/test', {
        pagination: { pageIndex: 2, pageSize: 50 },
      });
      expect(result).toContain('dt_page=3');
      expect(result).toContain('dt_pageSize=50');
    });

    it('should not add page parameter when pageIndex is 0', () => {
      const result = redirectToPageWithParam('/test', {
        pagination: { pageIndex: 0, pageSize: 25 },
      });
      expect(result).not.toContain('dt_page=');
      expect(result).toContain('dt_pageSize=25');
    });

    it('should add filters parameter', () => {
      const result = redirectToPageWithParam('/test', {
        filters: { status: ['ACTIVE', 'CLOSED'] },
      });
      expect(result).toContain('dt_filters=status%3AACTIVE%2CCLOSED');
    });

    it('should add sorting parameters', () => {
      const result = redirectToPageWithParam('/test', {
        sorting: [{ id: 'createdAt', desc: true }],
      });
      expect(result).toContain('dt_sortBy=createdAt');
      expect(result).toContain('dt_sortDesc=true');
    });

    it('should combine multiple parameters', () => {
      const result = redirectToPageWithParam('/test', {
        prefilter: 'active',
        search: 'john',
        pagination: { pageIndex: 1, pageSize: 20 },
        filters: { status: ['ACTIVE'] },
        sorting: [{ id: 'name', desc: false }],
      });
      expect(result).toContain('dt_prefilter=active');
      expect(result).toContain('dt_search=john');
      expect(result).toContain('dt_page=2');
      expect(result).toContain('dt_pageSize=20');
      expect(result).toContain('dt_filters=');
      expect(result).toContain('dt_sortBy=name');
      expect(result).toContain('dt_sortDesc=false');
    });

    it('should not add empty filters', () => {
      const result = redirectToPageWithParam('/test', { filters: {} });
      expect(result).not.toContain('dt_filters');
    });

    it('should not add empty sorting', () => {
      const result = redirectToPageWithParam('/test', { sorting: [] });
      expect(result).not.toContain('dt_sortBy');
      expect(result).not.toContain('dt_sortDesc');
    });

    it('should handle URLs with existing path', () => {
      const result = redirectToPageWithParam('/app/users/list', { prefilter: 'all' });
      expect(result).toBe('/app/users/list?dt_prefilter=all');
    });
  });
});
