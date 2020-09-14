import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnquiryPage } from './enquiry.page';

describe('EnquiryPage', () => {
  let component: EnquiryPage;
  let fixture: ComponentFixture<EnquiryPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnquiryPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnquiryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
