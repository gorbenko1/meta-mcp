import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MetaApiClient } from '../../src/meta-client';
import { setupCreativeTools } from '../../src/tools/creatives';
import { mockFactory } from '../helpers/mock-factory';
import type { AdCreative, AdImage, AdVideo } from '../../src/types';

jest.mock('../../src/meta-client');

describe('Creative Tools', () => {
  let server: Server;
  let mockClient: jest.Mocked<MetaApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    server = new Server(
      {
        name: 'meta-mcp-test',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    mockClient = new MetaApiClient({
      accessToken: 'test-token'
    }) as jest.Mocked<MetaApiClient>;

    setupCreativeTools(server, mockClient);
  });

  describe('list-ad-creatives', () => {
    it('should list all ad creatives for an account', async () => {
      const mockCreatives = mockFactory.generateBatchData(() => 
        mockFactory.generateAdCreative(), 6
      );
      const mockResponse = mockFactory.generatePaginatedResponse(mockCreatives);
      
      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-ad-creatives',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/adcreatives', {
        fields: expect.stringContaining('id,name,status,body,title,link_url,image_url,call_to_action_type')
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Found 6 ad creatives')
      });
    });

    it('should handle status filtering', async () => {
      const mockCreatives = mockFactory.generateBatchData(() => 
        mockFactory.generateAdCreative({ status: 'ACTIVE' }), 3
      );
      const mockResponse = mockFactory.generatePaginatedResponse(mockCreatives);
      
      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-ad-creatives',
          arguments: {
            account_id: 'act_123456',
            status: 'ACTIVE'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/adcreatives', {
        fields: expect.any(String),
        filtering: JSON.stringify([{ field: 'status', operator: 'IN', value: ['ACTIVE'] }])
      });
    });

    it('should handle pagination', async () => {
      const mockCreatives = mockFactory.generateBatchData(() => 
        mockFactory.generateAdCreative(), 25
      );
      const mockResponse = mockFactory.generatePaginatedResponse(mockCreatives, true);
      
      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-ad-creatives',
          arguments: {
            account_id: 'act_123456',
            limit: 50
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/adcreatives', {
        fields: expect.any(String),
        limit: 50
      });

      expect(result?.content?.[0].text).toContain('Next Page Available');
    });
  });

  describe('get-creative-details', () => {
    it('should fetch detailed creative information', async () => {
      const mockCreative = mockFactory.generateAdCreative({
        name: 'Summer Sale Creative',
        body: 'Get 50% off all summer items!',
        title: 'Summer Sale',
        link_url: 'https://example.com/summer-sale',
        call_to_action_type: 'SHOP_NOW'
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockCreative);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-creative-details',
          arguments: {
            creative_id: '123456'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456', {
        fields: expect.stringContaining('id,name,status,body,title,link_url,image_url,call_to_action_type,object_story_spec')
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Summer Sale Creative')
      });

      expect(result?.content?.[0].text).toContain('Get 50% off all summer items!');
      expect(result?.content?.[0].text).toContain('SHOP_NOW');
    });

    it('should handle carousel creative details', async () => {
      const mockCreative = mockFactory.generateAdCreative({
        object_story_spec: {
          page_id: '123456',
          link_data: {
            child_attachments: [
              {
                link: 'https://example.com/product1',
                name: 'Product 1',
                description: 'First product',
                image_hash: 'hash1',
                call_to_action: {
                  type: 'SHOP_NOW',
                  value: {
                    link: 'https://example.com/product1'
                  }
                }
              },
              {
                link: 'https://example.com/product2',
                name: 'Product 2',
                description: 'Second product',
                image_hash: 'hash2',
                call_to_action: {
                  type: 'SHOP_NOW',
                  value: {
                    link: 'https://example.com/product2'
                  }
                }
              }
            ]
          }
        }
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockCreative);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-creative-details',
          arguments: {
            creative_id: '123456'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Carousel Creative');
      expect(result?.content?.[0].text).toContain('Product 1');
      expect(result?.content?.[0].text).toContain('Product 2');
    });
  });

  describe('create-ad-creative', () => {
    it('should create a single image ad creative', async () => {
      const mockCreative = mockFactory.generateAdCreative({
        name: 'New Single Image Ad'
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockCreative);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-ad-creative',
          arguments: {
            account_id: 'act_123456',
            name: 'New Single Image Ad',
            object_story_spec: {
              page_id: '123456',
              link_data: {
                link: 'https://example.com',
                message: 'Check out our new product!',
                name: 'New Product',
                description: 'Amazing new product description',
                image_hash: 'abc123',
                call_to_action: {
                  type: 'SHOP_NOW',
                  value: {
                    link: 'https://example.com/shop'
                  }
                }
              }
            }
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/adcreatives', {}, {
        name: 'New Single Image Ad',
        object_story_spec: {
          page_id: '123456',
          link_data: {
            link: 'https://example.com',
            message: 'Check out our new product!',
            name: 'New Product',
            description: 'Amazing new product description',
            image_hash: 'abc123',
            call_to_action: {
              type: 'SHOP_NOW',
              value: {
                link: 'https://example.com/shop'
              }
            }
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Ad creative created successfully')
      });
    });

    it('should create a video ad creative', async () => {
      const mockCreative = mockFactory.generateAdCreative({
        name: 'New Video Ad'
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockCreative);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-ad-creative',
          arguments: {
            account_id: 'act_123456',
            name: 'New Video Ad',
            object_story_spec: {
              page_id: '123456',
              video_data: {
                video_id: 'vid123',
                message: 'Watch our amazing video!',
                title: 'Product Demo',
                call_to_action: {
                  type: 'LEARN_MORE',
                  value: {
                    link: 'https://example.com/demo'
                  }
                }
              }
            }
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/adcreatives', {}, {
        name: 'New Video Ad',
        object_story_spec: {
          page_id: '123456',
          video_data: {
            video_id: 'vid123',
            message: 'Watch our amazing video!',
            title: 'Product Demo',
            call_to_action: {
              type: 'LEARN_MORE',
              value: {
                link: 'https://example.com/demo'
              }
            }
          }
        }
      });
    });

    it('should create a carousel ad creative', async () => {
      const mockCreative = mockFactory.generateAdCreative({
        name: 'New Carousel Ad'
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockCreative);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-ad-creative',
          arguments: {
            account_id: 'act_123456',
            name: 'New Carousel Ad',
            object_story_spec: {
              page_id: '123456',
              link_data: {
                link: 'https://example.com',
                message: 'Check out our product collection!',
                child_attachments: [
                  {
                    link: 'https://example.com/product1',
                    name: 'Product 1',
                    description: 'First product',
                    image_hash: 'hash1',
                    call_to_action: {
                      type: 'SHOP_NOW',
                      value: {
                        link: 'https://example.com/product1'
                      }
                    }
                  },
                  {
                    link: 'https://example.com/product2',
                    name: 'Product 2',
                    description: 'Second product',
                    image_hash: 'hash2',
                    call_to_action: {
                      type: 'SHOP_NOW',
                      value: {
                        link: 'https://example.com/product2'
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/adcreatives', {}, {
        name: 'New Carousel Ad',
        object_story_spec: {
          page_id: '123456',
          link_data: {
            link: 'https://example.com',
            message: 'Check out our product collection!',
            child_attachments: expect.arrayContaining([
              expect.objectContaining({
                name: 'Product 1',
                image_hash: 'hash1'
              }),
              expect.objectContaining({
                name: 'Product 2',
                image_hash: 'hash2'
              })
            ])
          }
        }
      });
    });
  });

  describe('update-ad-creative', () => {
    it('should update creative properties', async () => {
      mockClient.request = jest.fn().mockResolvedValue({ success: true });

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'update-ad-creative',
          arguments: {
            creative_id: '123456',
            name: 'Updated Creative Name',
            status: 'ACTIVE'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456', {}, {
        name: 'Updated Creative Name',
        status: 'ACTIVE'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Ad creative updated successfully')
      });
    });
  });

  describe('delete-ad-creative', () => {
    it('should delete a creative', async () => {
      mockClient.request = jest.fn().mockResolvedValue({ success: true });

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'delete-ad-creative',
          arguments: {
            creative_id: '123456'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456', {}, null, 'DELETE');

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Ad creative deleted successfully')
      });
    });
  });

  describe('Image Management', () => {
    describe('list-ad-images', () => {
      it('should list all images for an account', async () => {
        const mockImages = mockFactory.generateBatchData(() => 
          mockFactory.generateAdImage(), 8
        );
        const mockResponse = mockFactory.generatePaginatedResponse(mockImages);
        
        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'list-ad-images',
            arguments: {
              account_id: 'act_123456'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/act_123456/adimages', {
          fields: expect.stringContaining('id,hash,url,height,width,name,created_time')
        });

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Found 8 ad images')
        });
      });
    });

    describe('upload-ad-image', () => {
      it('should upload an image from URL', async () => {
        const mockImage = mockFactory.generateAdImage({
          name: 'test-image.jpg',
          url: 'https://example.com/test-image.jpg'
        });
        
        mockClient.request = jest.fn().mockResolvedValue(mockImage);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'upload-ad-image',
            arguments: {
              account_id: 'act_123456',
              image_url: 'https://example.com/test-image.jpg',
              name: 'test-image.jpg'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/act_123456/adimages', {}, {
          url: 'https://example.com/test-image.jpg',
          name: 'test-image.jpg'
        });

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Image uploaded successfully')
        });
      });

      it('should upload an image from file path', async () => {
        const mockImage = mockFactory.generateAdImage({
          name: 'local-image.jpg'
        });
        
        mockClient.request = jest.fn().mockResolvedValue(mockImage);

        const handler = server._requestHandlers.get('tools/call');
        await handler?.({
          method: 'tools/call',
          params: {
            name: 'upload-ad-image',
            arguments: {
              account_id: 'act_123456',
              file_path: '/path/to/local-image.jpg',
              name: 'local-image.jpg'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/act_123456/adimages', {}, {
          file_path: '/path/to/local-image.jpg',
          name: 'local-image.jpg'
        });
      });

      it('should handle upload errors', async () => {
        mockClient.request = jest.fn().mockRejectedValue(new Error('Image too large'));

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'upload-ad-image',
            arguments: {
              account_id: 'act_123456',
              image_url: 'https://example.com/large-image.jpg'
            }
          }
        });

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Error uploading image: Image too large')
        });
      });
    });

    describe('delete-ad-image', () => {
      it('should delete an image', async () => {
        mockClient.request = jest.fn().mockResolvedValue({ success: true });

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'delete-ad-image',
            arguments: {
              account_id: 'act_123456',
              image_hash: 'abc123'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/act_123456/adimages', {}, {
          hash: 'abc123'
        }, 'DELETE');

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Image deleted successfully')
        });
      });
    });
  });

  describe('Video Management', () => {
    describe('list-ad-videos', () => {
      it('should list all videos for an account', async () => {
        const mockVideos = mockFactory.generateBatchData(() => 
          mockFactory.generateAdVideo(), 4
        );
        const mockResponse = mockFactory.generatePaginatedResponse(mockVideos);
        
        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'list-ad-videos',
            arguments: {
              account_id: 'act_123456'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/act_123456/advideos', {
          fields: expect.stringContaining('id,title,description,source,picture,created_time')
        });

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Found 4 ad videos')
        });
      });
    });

    describe('upload-ad-video', () => {
      it('should upload a video from URL', async () => {
        const mockVideo = mockFactory.generateAdVideo({
          title: 'Test Video',
          description: 'A test video for ads'
        });
        
        mockClient.request = jest.fn().mockResolvedValue(mockVideo);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'upload-ad-video',
            arguments: {
              account_id: 'act_123456',
              video_url: 'https://example.com/test-video.mp4',
              title: 'Test Video',
              description: 'A test video for ads'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/act_123456/advideos', {}, {
          url: 'https://example.com/test-video.mp4',
          title: 'Test Video',
          description: 'A test video for ads'
        });

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Video uploaded successfully')
        });
      });

      it('should upload a video from file path', async () => {
        const mockVideo = mockFactory.generateAdVideo({
          title: 'Local Video'
        });
        
        mockClient.request = jest.fn().mockResolvedValue(mockVideo);

        const handler = server._requestHandlers.get('tools/call');
        await handler?.({
          method: 'tools/call',
          params: {
            name: 'upload-ad-video',
            arguments: {
              account_id: 'act_123456',
              file_path: '/path/to/local-video.mp4',
              title: 'Local Video'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/act_123456/advideos', {}, {
          file_path: '/path/to/local-video.mp4',
          title: 'Local Video'
        });
      });
    });

    describe('delete-ad-video', () => {
      it('should delete a video', async () => {
        mockClient.request = jest.fn().mockResolvedValue({ success: true });

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'delete-ad-video',
            arguments: {
              video_id: '123456'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/123456', {}, null, 'DELETE');

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Video deleted successfully')
        });
      });
    });
  });

  describe('Preview and Testing', () => {
    describe('generate-ad-preview', () => {
      it('should generate ad preview', async () => {
        const mockPreview = {
          body: '<div>Ad Preview HTML</div>'
        };
        
        mockClient.request = jest.fn().mockResolvedValue(mockPreview);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'generate-ad-preview',
            arguments: {
              creative_id: '123456',
              ad_format: 'DESKTOP_FEED_STANDARD'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/123456/previews', {
          ad_format: 'DESKTOP_FEED_STANDARD'
        });

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Ad Preview Generated')
        });
      });

      it('should handle multiple ad formats', async () => {
        const mockPreview = {
          body: '<div>Mobile Ad Preview</div>'
        };
        
        mockClient.request = jest.fn().mockResolvedValue(mockPreview);

        const handler = server._requestHandlers.get('tools/call');
        await handler?.({
          method: 'tools/call',
          params: {
            name: 'generate-ad-preview',
            arguments: {
              creative_id: '123456',
              ad_format: 'MOBILE_FEED_STANDARD',
              product_item_ids: ['item1', 'item2']
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/123456/previews', {
          ad_format: 'MOBILE_FEED_STANDARD',
          product_item_ids: ['item1', 'item2']
        });
      });
    });

    describe('test-ad-creative', () => {
      it('should test creative against policy', async () => {
        const mockTestResult = {
          policy_topics: [
            {
              topic: 'adult_content',
              enforcement_action: 'NONE'
            },
            {
              topic: 'misleading_content',
              enforcement_action: 'WARN'
            }
          ]
        };
        
        mockClient.request = jest.fn().mockResolvedValue(mockTestResult);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'test-ad-creative',
            arguments: {
              creative_id: '123456'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/123456', {
          fields: 'policy_topics'
        });

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Policy Test Results')
        });

        expect(result?.content?.[0].text).toContain('adult_content: NONE');
        expect(result?.content?.[0].text).toContain('misleading_content: WARN');
      });

      it('should handle clean creative results', async () => {
        const mockTestResult = {
          policy_topics: []
        };
        
        mockClient.request = jest.fn().mockResolvedValue(mockTestResult);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'test-ad-creative',
            arguments: {
              creative_id: '123456'
            }
          }
        });

        expect(result?.content?.[0].text).toContain('✅ Creative passed all policy checks');
      });
    });
  });

  describe('Advanced Features', () => {
    describe('duplicate-ad-creative', () => {
      it('should duplicate a creative', async () => {
        const mockOriginal = mockFactory.generateAdCreative({
          name: 'Original Creative'
        });
        const mockDuplicate = mockFactory.generateAdCreative({
          name: 'Copy of Original Creative'
        });
        
        mockClient.request = jest.fn()
          .mockResolvedValueOnce(mockOriginal)
          .mockResolvedValueOnce(mockDuplicate);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'duplicate-ad-creative',
            arguments: {
              creative_id: '123456',
              new_name: 'Copy of Original Creative'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledTimes(2);
        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Creative duplicated successfully')
        });
      });
    });

    describe('batch-create-creatives', () => {
      it('should create multiple creatives in batch', async () => {
        const mockCreatives = [
          mockFactory.generateAdCreative({ name: 'Creative 1' }),
          mockFactory.generateAdCreative({ name: 'Creative 2' }),
          mockFactory.generateAdCreative({ name: 'Creative 3' })
        ];
        
        mockClient.request = jest.fn()
          .mockResolvedValueOnce(mockCreatives[0])
          .mockResolvedValueOnce(mockCreatives[1])
          .mockResolvedValueOnce(mockCreatives[2]);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'batch-create-creatives',
            arguments: {
              account_id: 'act_123456',
              creatives: [
                {
                  name: 'Creative 1',
                  object_story_spec: {
                    page_id: '123456',
                    link_data: {
                      message: 'Message 1',
                      link: 'https://example.com/1'
                    }
                  }
                },
                {
                  name: 'Creative 2',
                  object_story_spec: {
                    page_id: '123456',
                    link_data: {
                      message: 'Message 2',
                      link: 'https://example.com/2'
                    }
                  }
                },
                {
                  name: 'Creative 3',
                  object_story_spec: {
                    page_id: '123456',
                    link_data: {
                      message: 'Message 3',
                      link: 'https://example.com/3'
                    }
                  }
                }
              ]
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledTimes(3);
        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Created 3 creatives successfully')
        });
      });

      it('should handle partial failures in batch creation', async () => {
        mockClient.request = jest.fn()
          .mockResolvedValueOnce(mockFactory.generateAdCreative({ name: 'Creative 1' }))
          .mockRejectedValueOnce(new Error('Invalid creative data'))
          .mockResolvedValueOnce(mockFactory.generateAdCreative({ name: 'Creative 3' }));

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'batch-create-creatives',
            arguments: {
              account_id: 'act_123456',
              creatives: [
                { name: 'Creative 1', object_story_spec: { page_id: '123456' } },
                { name: 'Creative 2', object_story_spec: { page_id: '123456' } },
                { name: 'Creative 3', object_story_spec: { page_id: '123456' } }
              ]
            }
          }
        });

        expect(result?.content?.[0].text).toContain('Created 2 out of 3 creatives');
        expect(result?.content?.[0].text).toContain('Failed: 1');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid creative format', async () => {
      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-ad-creative',
          arguments: {
            account_id: 'act_123456',
            name: 'Invalid Creative'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error')
      });
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-ad-creatives',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Rate limit exceeded')
      });
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('User does not have permission');
      permissionError.name = 'PermissionException';
      mockClient.request = jest.fn().mockRejectedValue(permissionError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'delete-ad-creative',
          arguments: {
            creative_id: '123456'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('User does not have permission')
      });
    });
  });
});