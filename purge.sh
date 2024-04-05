#!/bin/sh

echo 'purging Excel cache(s)'
rm -rfv $HOME/Library/Containers/com.microsoft.Excel/Data/Library/Caches/*
rm -rfv $HOME/Library/Containers/com.microsoft.Excel/Data/Library/Application\ Support/Microsoft/Office/16.0/Wef/*
rm -rfv $HOME/Library/Containers/com.microsoft.Office365ServiceV2/Data/Caches/com.microsoft.Office365ServiceV2/*
rm -rfv $HOME/Library/Containers/com.microsoft.Office365ServiceV2/Data/Library/Caches/com.microsoft.Office365ServiceV2/*
 